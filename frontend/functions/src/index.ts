// functions/src/index.ts
import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {defineString} from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();
const db = admin.firestore();

// Define environment parameters
const emailUser = defineString('EMAIL_USER');
const emailPassword = defineString('EMAIL_PASSWORD');

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: string;
  template: string;
  data: Record<string, any>;
  status?: string;
  attempts?: number;
  createdAt?: any;
}

// Configure your email service (Gmail)
const getTransporter = () => {
  // Get credentials from defined parameters
  const userEmail = emailUser.value();
  const userPassword = emailPassword.value();
  
  console.log('Email user:', userEmail);
  console.log('Email password set:', !!userPassword);
  
  if (!userEmail || !userPassword) {
    throw new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASSWORD environment variables');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: userEmail,
      pass: userPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const processEmailQueue = onDocumentCreated(
  {
    document: 'emailQueue/{emailId}',
    region: 'us-central1'
  },
  async (event) => {
    const emailData = event.data?.data() as EmailData;
    const emailId = event.params?.emailId;

    if (!emailData || !emailId) {
      console.error('No email data found');
      return;
    }

    console.log(`Processing email ${emailId} to ${emailData.to}`);

    try {
      const transporter = getTransporter();

      // Verify transporter configuration
      await transporter.verify();
      console.log('SMTP server connection verified');

      // Send email using Nodemailer
      const mailOptions = {
        from: `"Sofa Rental Platform" <${emailUser.value()}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || stripHtml(emailData.html)
      };

      console.log(`Sending email to ${emailData.to}...`);
      const result = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully:`, result.messageId);

      // Update email status to sent
      await db.collection('emailQueue').doc(emailId).update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        messageId: result.messageId
      });

      console.log(`Email ${emailId} marked as sent`);

    } catch (error: any) {
      console.error('Error sending email:', error);

      // Update email status to failed and increment attempts
      await db.collection('emailQueue').doc(emailId).update({
        status: 'failed',
        error: error.message,
        attempts: admin.firestore.FieldValue.increment(1),
        lastAttempt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Retry logic: if attempts < 3, schedule retry
      const currentAttempts = (emailData.attempts || 0) + 1;
      if (currentAttempts < 3) {
        console.log(`Scheduling retry for email ${emailId} (attempt ${currentAttempts})`);
        setTimeout(async () => {
          await db.collection('emailQueue').doc(emailId).update({
            status: 'pending'
          });
        }, 300000); // Retry after 5 minutes
      } else {
        console.log(`Email ${emailId} failed permanently after ${currentAttempts} attempts`);
      }
    }
  }
);

// Helper function to strip HTML for plain text
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

// Optional: Clean up old processed emails
export const cleanupEmailQueue = onSchedule(
  {
    schedule: 'every 24 hours',
    region: 'us-central1'
  },
  async (event) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7); // Delete emails older than 7 days

    const snapshot = await db
      .collection('emailQueue')
      .where('createdAt', '<', cutoff)
      .where('status', 'in', ['sent', 'failed'])
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Cleaned up ${snapshot.docs.length} old email records`);
  }
);