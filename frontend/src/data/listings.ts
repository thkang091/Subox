 // =========================
  // Mock Data
  // =========================

  export const featuredListings = [
    {
      id: 1,
      hostImage: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
      hostName: "Tony Shin",
      hostBio: "Hello, I'm going to University of Minnesota",
      title: "Modern Studio near Campus",
      location: "Dinkytown",
      price: 950,
      distance: 0.3,
      dateRange: "Jun 1 - Aug 31",
      availableFrom: new Date(2025, 5, 1), // June 1
      availableTo: new Date(2025, 7, 31), // August 31
      accommodationType: 'entire',
      bedrooms: 1,
      bathrooms: 1,
      image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&h=500&auto=format&fit=crop",
      additionalImages: [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1561037404-61cd46aa615b?q=80&w=800&h=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1561037404-61cd46aa615b?q=80&w=800&h=500&auto=format&fit=crop"
        ],
      rating: 4.8,
      reviews: 24,
      amenities: ['wifi', 'laundry', 'furnished'],
      description: "This modern studio is a five-minute walk from campus. It was recently remodeled and boasts a neat, modern atmosphere. It's close to school, so you can sleep a lot. Living alone gives you so many benefits, but it's very cheap. I'm looking for someone to continue using from June through the end of August.",
      preferredGender: "any" 
    },
    {
      id: 2,
      title: "Spacious 2BR with River View",
      location: "East Bank",
      price: 1450,
      distance: 0.7,
      dateRange: "May 15 - Sep 15",
      availableFrom: new Date(2025, 4, 15),
      availableTo: new Date(2025, 8, 15),
      accommodationType: 'entire',
      bedrooms: 2,
      bathrooms: 1,
      image: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=800&h=500&auto=format&fit=crop",
      additionalImages: [
        "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800&h=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=800&h=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1561948955-570b270e7c36?q=80&w=800&h=500&auto=format&fit=crop"
        ],
      rating: 4.6,
      reviews: 18,
      amenities: ['wifi', 'parking', 'laundry', 'ac']
    },
    {
      id: 3,
      title: "Cozy Apartment with Balcony",
      location: "Stadium Village",
      price: 1100,
      distance: 0.5,
      dateRange: "Jun 15 - Aug 15",
      availableFrom: new Date(2025, 5, 15),
      availableTo: new Date(2025, 7, 15),
      accommodationType: 'entire',
      bedrooms: 1,
      bathrooms: 1,
      image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?q=80&w=800&h=500&auto=format&fit=crop",
      rating: 4.9,
      reviews: 32,
      amenities: ['wifi', 'furnished', 'utilities', 'ac']
    },
    {
      id: 4,
      title: "Private Room in Shared House",
      location: "Como",
      price: 600,
      distance: 1.2,
      dateRange: "Available Now",
      availableFrom: new Date(),
      availableTo: new Date(2025, 11, 31),
      bedrooms: 1,
      bathrooms: 1,
      accommodationType: 'private',
      image: "https://images.unsplash.com/photo-1452857297128-d9c29adba80b?q=80&w=800&h=500&auto=format&fit=crop",
      rating: 4.5,
      reviews: 12,
      amenities: ['wifi', 'utilities', 'parking']
    },
    {
      id: 5,
      title: "Luxury 3BR Apartment",
      location: "East Bank",
      price: 1800,
      distance: 0.8,
      dateRange: "Jul 1 - Dec 31",
      availableFrom: new Date(2025, 6, 1),
      availableTo: new Date(2025, 11, 31),
      bedrooms: 3,
      bathrooms: 2,
      accommodationType: 'entire',
      image: "https://images.unsplash.com/photo-1497752531616-c3afd9760a11?q=80&w=800&h=500&auto=format&fit=crop",
      rating: 4.9,
      reviews: 8,
      amenities: ['wifi', 'parking', 'laundry', 'ac', 'gym', 'furnished']
    },
    {
      id: 6,
      title: "Budget-Friendly Studio",
      location: "Stadium Village",
      price: 700,
      distance: 0.6,
      dateRange: "Jun 1 - Aug 31",
      availableFrom: new Date(2025, 5, 1),
      availableTo: new Date(2025, 7, 31),
      bedrooms: 1,
      bathrooms: 1,
      accommodationType: 'entire',
      image: "https://images.unsplash.com/photo-1559214369-a6b1d7919865?q=80&w=800&h=500&auto=format&fit=crop",
      rating: 4.3,
      reviews: 15,
      amenities: ['wifi', 'utilities']
    },
    {
      id: 7,
      title: "Shared Room Near Library",
      location: "Dinkytown",
      price: 450,
      distance: 0.2,
      dateRange: "Available Now",
      availableFrom: new Date(),
      availableTo: new Date(2025, 11, 31),
      bedrooms: 1,
      bathrooms: 1,
      accommodationType: 'shared',
      image: "https://images.unsplash.com/photo-1535241749838-299277b6305f?q=80&w=800&h=500&auto=format&fit=crop",
      rating: 4.1,
      reviews: 20,
      amenities: ['wifi', 'utilities', 'laundry']
    },
    {
      id: 8,
      title: "Pet-Friendly 2BR House",
      location: "Como",
      price: 1600,
      distance: 1.5,
      dateRange: "May 1 - Oct 31",
      availableFrom: new Date(2025, 4, 1),
      availableTo: new Date(2025, 9, 31),
      bedrooms: 2,
      bathrooms: 2,
      accommodationType: 'entire',
      image: "https://images.unsplash.com/photo-1521673461164-de300ebcfb17?q=80&w=800&h=500&auto=format&fit=crop",
      rating: 4.7,
      reviews: 28,
      amenities: ['wifi', 'parking', 'laundry', 'pets', 'furnished', 'ac']
    },
    {
      id: 9,
      title: "Spacious 2BR with River View",
      location: "St. Paul",
      price: 1450,
      distance: 0.7,
      dateRange: "May 15 - Sep 15",
      availableFrom: new Date(2025, 4, 15),
      availableTo: new Date(2025, 8, 15),
      accommodationType: 'entire',
      bedrooms: 2,
      bathrooms: 1,
      image: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=800&h=500&auto=format&fit=crop",
      additionalImages: [
        "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800&h=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=800&h=500&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1561948955-570b270e7c36?q=80&w=800&h=500&auto=format&fit=crop"
        ],
      rating: 4.6,
      reviews: 18,
      amenities: ['wifi', 'parking', 'laundry', 'ac']
    }
  ];

  export const neighborhoods = [
    { name: 'Dinkytown', description: 'Historic student area with cafes and shops', image: '/images/dinkytown.jpeg' },
    { name: 'Stadium Village', description: 'Close to sports venues and campus', image: '/images/stadiumvillage.jpeg' },
    { name: 'Como', description: 'Quiet residential area near campus', image: '/images/como.jpeg' }
  ];
