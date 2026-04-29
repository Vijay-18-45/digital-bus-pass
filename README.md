# APSRTC Digital Bus Pass System

A web application to simplify and automate the APSRTC student bus pass process.

## Features

- **Online student registration & login**: Easy sign-up and login portal.
- **Apply for new or renewal bus pass**: Streamlined application process.
- **Upload required documents**: Securely upload ID proofs and forms.
- **Admin verification dashboard**: Dedicated portal for authorities to verify and approve applications.
- **Secure authentication using JWT**: Role-based access (Student / Admin) with encrypted tokens.
- **Online payment integration**: Convenient digital payments.
- **Automatic PDF bus pass generation**: Get a downloadable PDF instantly upon approval.
- **SMS / Email notifications**: Stay updated on application status.
- **Workflow automation using n8n**: Automated background tasks for seamless operations.

## Tech Stack

- **Frontend**: React.js, Vite, React Router, Socket.io-client
- **Backend**: Node.js, Express.js
- **Database**: MySQL / MongoDB (Supported via backend drivers)
- **Tools**: JWT (Authentication)

## How It Works

1. **Apply**: Students register and submit their bus pass application online, uploading necessary documents.
2. **Verify**: Admins log into the dashboard, review the submitted documents, and approve or reject the application.
3. **Generate**: Upon approval, the system automatically generates a digital bus pass in PDF format.
4. **Notify**: The student is notified via SMS or Email that their pass is ready for download and use.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vijay-18-45/digital-bus-pass.git
   cd digital-bus-pass
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   ```

3. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```

4. **Environment Variables:**
   - Create a `.env` file in the `backend` directory.
   - Add your database credentials and JWT secret key.

## Usage

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run server
   # Server runs on the designated PORT
   ```

2. **Start the Frontend Application:**
   ```bash
   cd frontend
   npm run dev
   # Vite server runs on localhost:5173
   ```

3. Open your browser and navigate to the frontend URL to use the application.

## Screenshots

*(Add screenshots of the application here, such as the landing page, student dashboard, admin verification panel, and the generated digital pass.)*

## Future Improvements

- Mobile application version for iOS and Android.
- Aadhaar-based verification for faster approvals.
- AI-based fraud detection for document scanning.
- Multi-language support (English, Telugu, Hindi).
- Real-time bus tracking integration.

## Author

- **Vijay** - [GitHub Profile](https://github.com/Vijay-18-45)
