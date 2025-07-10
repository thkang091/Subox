// lib/emailService.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmailData {
  to: string;
  subject: string;
  type: string;
  template: string;
  data: Record<string, any>;
  html: string;
  text?: string;
  status?: string;
  createdAt?: any;
  attempts?: number;
}

interface TourDetails {
  listingId: string;
  listingTitle: string;
  listingLocation: string;
  listingPrice: number;
  hostId: string;
  hostName: string;
  hostEmail: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  date: string;
  time: string;
  tourType: 'virtual' | 'in-person';
  message?: string;
}

interface EmailTemplateData {
  hostName?: string;
  guestName: string;
  guestEmail?: string;
  listingTitle: string;
  listingLocation: string;
  tourDate: string;
  tourTime: string;
  tourType: 'virtual' | 'in-person';
  message?: string;
  hostNote?: string;
  dashboardUrl: string;
}

class EmailService {
  // Send email via Firebase Functions or your email service
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      // Add to email queue collection for processing by Cloud Function
      await addDoc(collection(db, 'emailQueue'), {
        ...emailData,
        status: 'pending',
        createdAt: serverTimestamp(),
        attempts: 0
      });
      
      console.log('Email queued successfully');
      return true;
    } catch (error) {
      console.error('Error queueing email:', error);
      return false;
    }
  }

  // Email template for new tour request (to host)
  static async sendTourRequestEmail(
    hostEmail: string, 
    guestName: string, 
    guestEmail: string, 
    tourDetails: TourDetails
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: hostEmail,
      subject: `New Tour Request for ${tourDetails.listingTitle}`,
      type: 'tour_request',
      template: 'tour-request-host',
      data: {
        hostName: tourDetails.hostName,
        guestName,
        guestEmail,
        listingTitle: tourDetails.listingTitle,
        listingLocation: tourDetails.listingLocation,
        tourDate: new Date(tourDetails.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tourTime: tourDetails.time,
        tourType: tourDetails.tourType,
        message: tourDetails.message || '',
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tour/${tourDetails.listingId}`
      },
      html: this.generateTourRequestHostEmail({
        hostName: tourDetails.hostName,
        guestName,
        guestEmail,
        listingTitle: tourDetails.listingTitle,
        listingLocation: tourDetails.listingLocation,
        tourDate: new Date(tourDetails.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tourTime: tourDetails.time,
        tourType: tourDetails.tourType,
        message: tourDetails.message || '',
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tour/${tourDetails.listingId}`
      })
    };

    return await this.sendEmail(emailData);
  }

  // Email template for tour approval (to guest)
  static async sendTourApprovalEmail(
    guestEmail: string, 
    guestName: string, 
    tourDetails: TourDetails, 
    hostNote: string = ''
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: guestEmail,
      subject: `Tour Approved: ${tourDetails.listingTitle}`,
      type: 'tour_approved',
      template: 'tour-approved-guest',
      data: {
        guestName,
        hostName: tourDetails.hostName,
        listingTitle: tourDetails.listingTitle,
        listingLocation: tourDetails.listingLocation,
        tourDate: new Date(tourDetails.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tourTime: tourDetails.time,
        tourType: tourDetails.tourType,
        hostNote,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tour/${tourDetails.listingId}`
      },
      html: this.generateTourApprovalEmail({
        guestName,
        hostName: tourDetails.hostName,
        listingTitle: tourDetails.listingTitle,
        listingLocation: tourDetails.listingLocation,
        tourDate: new Date(tourDetails.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tourTime: tourDetails.time,
        tourType: tourDetails.tourType,
        hostNote,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tour/${tourDetails.listingId}`
      })
    };

    return await this.sendEmail(emailData);
  }

  // Email template for tour rejection (to guest)
  static async sendTourRejectionEmail(
    guestEmail: string, 
    guestName: string, 
    tourDetails: TourDetails, 
    hostNote: string = ''
  ): Promise<boolean> {
    const emailData: EmailData = {
      to: guestEmail,
      subject: `Tour Request Update: ${tourDetails.listingTitle}`,
      type: 'tour_rejected',
      template: 'tour-rejected-guest',
      data: {
        guestName,
        hostName: tourDetails.hostName,
        listingTitle: tourDetails.listingTitle,
        listingLocation: tourDetails.listingLocation,
        tourDate: new Date(tourDetails.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tourTime: tourDetails.time,
        tourType: tourDetails.tourType,
        hostNote,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tour/${tourDetails.listingId}`
      },
      html: this.generateTourRejectionEmail({
        guestName,
        hostName: tourDetails.hostName,
        listingTitle: tourDetails.listingTitle,
        listingLocation: tourDetails.listingLocation,
        tourDate: new Date(tourDetails.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tourTime: tourDetails.time,
        tourType: tourDetails.tourType,
        hostNote,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tour/${tourDetails.listingId}`
      })
    };

    return await this.sendEmail(emailData);
  }

  // HTML template for tour request to host
  static generateTourRequestHostEmail(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Tour Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: #f97316; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .tour-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .detail-label { font-weight: bold; color: #666; }
        .cta-button { display: inline-block; background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 10px 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .message-box { background: #e7f3ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏠 New Tour Request</h1>
        </div>
        
        <div class="content">
            <h2>Hi ${data.hostName}!</h2>
            <p>Great news! You have a new tour request for your property.</p>
            
            <div class="tour-details">
                <h3>🏡 Property Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Property:</span>
                    <span>${data.listingTitle}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span>${data.listingLocation}</span>
                </div>
            </div>

            <div class="tour-details">
                <h3>👤 Guest Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span>${data.guestName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span>${data.guestEmail}</span>
                </div>
            </div>

            <div class="tour-details">
                <h3>📅 Tour Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span>${data.tourDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span>${data.tourTime}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span>${data.tourType === 'virtual' ? '💻 Virtual Tour' : '🏠 In-Person Tour'}</span>
                </div>
            </div>

            ${data.message ? `
            <div class="message-box">
                <h4>💬 Message from ${data.guestName}:</h4>
                <p>"${data.message}"</p>
            </div>
            ` : ''}

            <p><strong>What's next?</strong></p>
            <p>Review this request and respond as soon as possible. ${data.guestName} is waiting to hear from you!</p>
            
            <a href="${data.dashboardUrl}" class="cta-button">Review & Respond</a>
        </div>
        
        <div class="footer">
            <p>This email was sent because you have a property listing that received a tour request.</p>
            <p>© 2025 Sofa Rental Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // HTML template for tour approval to guest
  static generateTourApprovalEmail(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tour Approved!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: #16a34a; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .tour-details { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #16a34a; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .detail-label { font-weight: bold; color: #666; }
        .cta-button { display: inline-block; background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 10px 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .note-box { background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
        .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Tour Approved!</h1>
        </div>
        
        <div class="content">
            <h2>Great news, ${data.guestName}!</h2>
            <p><strong>${data.hostName}</strong> has approved your tour request. Your tour is confirmed!</p>
            
            <div class="tour-details">
                <h3>🏡 Your Confirmed Tour</h3>
                <div class="detail-row">
                    <span class="detail-label">Property:</span>
                    <span>${data.listingTitle}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span>${data.listingLocation}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span>${data.tourDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span>${data.tourTime}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span>${data.tourType === 'virtual' ? '💻 Virtual Tour' : '🏠 In-Person Tour'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Host:</span>
                    <span>${data.hostName}</span>
                </div>
            </div>

            ${data.hostNote ? `
            <div class="note-box">
                <h4>📝 Message from ${data.hostName}:</h4>
                <p>"${data.hostNote}"</p>
            </div>
            ` : ''}

            <h3>📋 What to expect:</h3>
            ${data.tourType === 'virtual' ? `
            <p>🔗 <strong>Virtual Tour:</strong> ${data.hostName} will contact you with the video call link before your scheduled time.</p>
            ` : `
            <p>🏠 <strong>In-Person Tour:</strong> Meet ${data.hostName} at the property address at your scheduled time.</p>
            `}
            
            <p>💡 <strong>Tip:</strong> Prepare any questions you'd like to ask about the property, neighborhood, lease terms, or amenities.</p>
            
            <a href="${data.dashboardUrl}" class="cta-button">View Tour Details</a>
        </div>
        
        <div class="footer">
            <p>Looking forward to your tour! If you have any questions, feel free to reach out.</p>
            <p>© 2025 Sofa Rental Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // HTML template for tour rejection to guest
  static generateTourRejectionEmail(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tour Request Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: #dc2626; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .tour-details { background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #dc2626; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .detail-label { font-weight: bold; color: #666; }
        .cta-button { display: inline-block; background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 10px 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .note-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .suggestions { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Tour Request Update</h1>
        </div>
        
        <div class="content">
            <h2>Hi ${data.guestName},</h2>
            <p>Thank you for your interest in <strong>${data.listingTitle}</strong>. Unfortunately, ${data.hostName} is unable to accommodate your tour request for the requested time.</p>
            
            <div class="tour-details">
                <h3>🏡 Requested Tour Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Property:</span>
                    <span>${data.listingTitle}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span>${data.listingLocation}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Requested Date:</span>
                    <span>${data.tourDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Requested Time:</span>
                    <span>${data.tourTime}</span>
                </div>
            </div>

            ${data.hostNote ? `
            <div class="note-box">
                <h4>📝 Message from ${data.hostName}:</h4>
                <p>"${data.hostNote}"</p>
            </div>
            ` : ''}

            <div class="suggestions">
                <h3>💡 What's next?</h3>
                <p>Don't worry! You have several options:</p>
                <ul>
                    <li>📅 <strong>Try a different time:</strong> Check the host's availability for other dates and times</li>
                    <li>🔍 <strong>Explore similar properties:</strong> Browse other listings in the same area</li>
                    <li>💬 <strong>Contact the host:</strong> Ask about alternative time slots that might work</li>
                </ul>
            </div>
            
            <a href="${data.dashboardUrl}" class="cta-button">View Available Times</a>
        </div>
        
        <div class="footer">
            <p>Keep searching! The perfect place is out there waiting for you.</p>
            <p>© 2025 Sofa Rental Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export default EmailService;