# Campus Link

Campus Link is a comprehensive university event and notice management platform designed to bridge the gap between student organizers and participants. It provides a seamless interface for administrators to manage events and approvals, and for students to explore, register, and volunteer for campus activities. 
Demo: https://youtu.be/WnBSSv9bBmA?si=BBhrSPxwoR4oo2Ic

## 🚀 Key Features

### For Administrators

- **Event Management:** Create, update, and delete campus events with details like date, venue, category, and volunteer requirements.
- **Volunteer & Registration Oversight:** View real-time lists of approved volunteers and registered students for each event.
- **Application Review:** Accept or reject volunteer applications with a dedicated review interface.
- **Student Registration:** Exclusive access to register new student accounts to maintain a verified user base.
- **Notices:** Post important announcements visible to all students.

### For Students

- **Event Explorer:** Browse upcoming events, filter by category, venue, or branch.
- **One-Click Registration:** Seamless registration for workshops, hackathons, and seminars.
- **Volunteer Opportunities:** Apply for specific volunteer roles (Tech, Media, Logistics, etc.) within events.
- **Real-time Status:** Track the status of volunteer applications (Pending/Approved/Rejected) instantly.
- **Dashboard:** Personalized view of registered events and volunteer duties.

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (React Framework), Tailwind CSS
- **Backend / Database:** Firebase (Authentication, Firestore)
- **Icons:** Lucide React
- **Authentication:** Firebase Auth (Email/Password, Google Sign-In)

## ⚙️ Getting Started

### Prerequisites

- Node.js (v16 or higher)
- A Firebase Project with Firestore and Authentication enabled.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/campus-link.git
    cd campus-link
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add your Firebase credentials (refer to `src/lib/firebase.js` or your Firebase Console for keys):

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🔒 Security Notes

- **Role-Based Access:** The application strictly enforces `admin` vs `student` roles.
- **Registration:** Public registration is disabled; only Admins can create new student accounts to ensure platform integrity.

---

Built with ❤️ for Campus Communities.
