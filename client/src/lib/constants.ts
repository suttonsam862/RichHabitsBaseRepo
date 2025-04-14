// Constants and shared data for the application

// Sample staff/clinician data
export const sampleStaffMembers = [
  {
    id: 1,
    name: "John Smith",
    role: "Head Coach",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    avatar: "",
    status: "active",
    experience: "12 years",
    skills: ["Wrestling", "Strength Training", "Leadership"],
    certifications: ["USA Wrestling Bronze", "First Aid/CPR", "SafeSport"],
    rate: 250,
    rateType: "daily",
    availability: "full-time",
    camps: [
      { id: 1, name: "Summer Wrestling Camp 2025" },
      { id: 3, name: "Winter Training Camp" }
    ],
    assignedShifts: [
      { 
        id: 1, 
        campId: 1,
        campName: "Summer Wrestling Camp 2025",
        date: "2025-06-15", 
        startTime: "08:00 AM", 
        endTime: "06:00 PM",
        location: "Main Training Area",
        role: "Lead Instructor",
        notes: "Opening day orientation and training"
      },
      { 
        id: 2, 
        campId: 1,
        campName: "Summer Wrestling Camp 2025",
        date: "2025-06-16", 
        startTime: "07:30 AM", 
        endTime: "06:30 PM",
        location: "Main Training Area",
        role: "Lead Instructor",
        notes: "Technique sessions and live wrestling"
      }
    ],
    documents: [
      { id: 1, name: "Contract", status: "signed", date: "2025-03-15" },
      { id: 2, name: "Background Check", status: "approved", date: "2025-03-20" },
      { id: 3, name: "W-9 Form", status: "submitted", date: "2025-03-22" }
    ],
    emergencyContact: {
      name: "Mary Smith",
      relationship: "Spouse",
      phone: "(555) 987-6543"
    }
  },
  {
    id: 2,
    name: "Sarah Thompson",
    role: "Assistant Coach",
    email: "sarah.thompson@example.com",
    phone: "(555) 234-5678",
    avatar: "",
    status: "active",
    experience: "8 years",
    skills: ["Wrestling", "Nutrition", "Youth Development"],
    certifications: ["USA Wrestling Silver", "Nutrition Specialist", "SafeSport"],
    rate: 200,
    rateType: "daily",
    availability: "full-time",
    camps: [
      { id: 1, name: "Summer Wrestling Camp 2025" },
      { id: 2, name: "Spring Training Clinic" }
    ],
    assignedShifts: [
      { 
        id: 3, 
        campId: 1,
        campName: "Summer Wrestling Camp 2025",
        date: "2025-06-15", 
        startTime: "08:00 AM", 
        endTime: "06:00 PM",
        location: "Secondary Training Area",
        role: "Assistant Instructor",
        notes: "Working with beginner group"
      }
    ],
    documents: [
      { id: 4, name: "Contract", status: "signed", date: "2025-03-10" },
      { id: 5, name: "Background Check", status: "approved", date: "2025-03-12" },
      { id: 6, name: "W-9 Form", status: "submitted", date: "2025-03-15" }
    ],
    emergencyContact: {
      name: "Michael Thompson",
      relationship: "Spouse",
      phone: "(555) 876-5432"
    }
  },
  {
    id: 3,
    name: "David Johnson",
    role: "Athletic Trainer",
    email: "david.johnson@example.com",
    phone: "(555) 345-6789",
    avatar: "",
    status: "active",
    experience: "6 years",
    skills: ["Sports Medicine", "Injury Prevention", "Rehabilitation"],
    certifications: ["Certified Athletic Trainer", "First Aid/CPR", "SafeSport"],
    rate: 220,
    rateType: "daily",
    availability: "part-time",
    camps: [
      { id: 1, name: "Summer Wrestling Camp 2025" }
    ],
    assignedShifts: [
      { 
        id: 4, 
        campId: 1,
        campName: "Summer Wrestling Camp 2025",
        date: "2025-06-15", 
        startTime: "08:00 AM", 
        endTime: "06:00 PM",
        location: "Medical Area",
        role: "Lead Athletic Trainer",
        notes: "Initial assessments and medical station setup"
      }
    ],
    documents: [
      { id: 7, name: "Contract", status: "signed", date: "2025-03-18" },
      { id: 8, name: "Background Check", status: "pending", date: "2025-03-22" },
      { id: 9, name: "W-9 Form", status: "submitted", date: "2025-03-20" }
    ],
    emergencyContact: {
      name: "Lisa Johnson",
      relationship: "Spouse",
      phone: "(555) 765-4321"
    }
  },
  {
    id: 4,
    name: "Michael Wilson",
    role: "Strength & Conditioning",
    email: "michael.wilson@example.com",
    phone: "(555) 456-7890",
    avatar: "",
    status: "pending",
    experience: "4 years",
    skills: ["Strength Training", "Conditioning", "Mobility"],
    certifications: ["CSCS", "First Aid/CPR", "SafeSport"],
    rate: 200,
    rateType: "daily",
    availability: "part-time",
    camps: [],
    assignedShifts: [],
    documents: [
      { id: 10, name: "Contract", status: "pending", date: "2025-03-25" },
      { id: 11, name: "Background Check", status: "submitted", date: "2025-03-26" },
      { id: 12, name: "W-9 Form", status: "pending", date: "2025-03-26" }
    ],
    emergencyContact: {
      name: "Jennifer Wilson",
      relationship: "Spouse",
      phone: "(555) 654-3210"
    }
  },
  {
    id: 5,
    name: "Robert Davis",
    role: "Head Coach",
    email: "robert.davis@example.com",
    phone: "(555) 567-8901",
    avatar: "",
    status: "active",
    experience: "15 years",
    skills: ["Wrestling", "Mixed Martial Arts", "Fitness Training"],
    certifications: ["USA Wrestling Silver", "First Aid/CPR", "SafeSport"],
    rate: 275,
    rateType: "daily",
    availability: "full-time",
    camps: [
      { id: 3, name: "Winter Training Camp" }
    ],
    assignedShifts: [
      { 
        id: 5, 
        campId: 3,
        campName: "Winter Training Camp",
        date: "2025-01-05", 
        startTime: "07:00 AM", 
        endTime: "07:00 PM",
        location: "Alpine Training Facility",
        role: "Lead Instructor",
        notes: "Elite athlete program kickoff"
      }
    ],
    documents: [
      { id: 13, name: "Contract", status: "signed", date: "2025-02-10" },
      { id: 14, name: "Background Check", status: "approved", date: "2025-02-15" },
      { id: 15, name: "W-9 Form", status: "submitted", date: "2025-02-12" }
    ],
    emergencyContact: {
      name: "Karen Davis",
      relationship: "Spouse",
      phone: "(555) 543-2109"
    }
  }
];

// Camp status colors
export const getStatusColor = (status: string) => {
  switch(status) {
    case 'upcoming':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'current':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'completed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// Document status colors
export const getDocumentStatusColor = (status: string) => {
  switch(status) {
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'signed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'submitted':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};