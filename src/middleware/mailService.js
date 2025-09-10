const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    // secure: true,
    auth: {
        user: "mankavit.clatcoaching11@gmail.com",
        pass: "ADOJ6z04yjbaL9TY",
    },
});
const fromMail = "mankavit.clatcoaching11@gmail.com";
const supportMail = "mankavit.clatcoaching11@gmail.com";
const siteUrl = "https://mankavit-frontend.vercel.app/";
const contactNumber = "+91-7979700796";
const playStoreLink = ""
const appStoreLink = ""
exports.sendWelcomeEmail = async (studentName, studentEmail) => {
    const mailOptions = {
        from: fromMail,
        to: studentEmail,
        subject: 'Welcome to Mankavit Law Academy – Your Path to LLM Success Starts Here!',
        html: `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Mankavit Law Academy</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 10px;
        }
        h2 {
            color: #2d3748;
            margin-top: 0;
        }
        .highlight {
            color: #4a5568;
            font-weight: bold;
        }
        .app-download {
            text-align: center;
            margin: 25px 0;
        
            padding: 15px;
            background-color: #f7fafc;
            border-radius: 6px;
        }
        .app-icons {
            margin: 15px 0;
        }
        .app-icons a {
            margin: 0 10px;
            text-decoration: none;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #718096;
        }
        .signature {
            margin-top: 25px;
            font-style: italic;
        }
        a {
            color: #4299e1;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Mankavit Law Academy</div>
            <p>Your trusted partner in cracking CLAT LLM, DU LLM, AILET LLM, and other prestigious LLM entrance exams</p>
        </div>

        <h2>Dear ${studentName},</h2>
        
        <p>We are delighted to welcome you to <strong>Mankavit Law Academy</strong>!</p>
        
        <p>You have signed up for Mankavit Law Academy, the best place for LL.M. Entrance Exam preparations. You can use this email ID as the username for logging into our website. Browse through our ongoing courses <a href="https://mankavit-frontend.vercel.app/">here</a>.</p>
        
        <p><span class="highlight">Our promise:</span> We're as invested in your success as you are!</p>
        
        <p>Need help? Reply to this email or visit our <a href="https://mankavit-frontend.vercel.app/">Support Page</a>.</p>

        

        <div class="signature">
            <p>Warm regards,<br>
            <strong>Anuja Lal</strong><br>
            Mankavit Law Academy</p>
        </div>

        <div class="app-download">
            <h3>Download our Mobile App</h3>
            <div class="app-icons">
                <a href="https://play.google.com/store/games?hl=en_IN">
                    <img src="https://cdn-icons-png.flaticon.com/512/300/300218.png" alt="Google Play" width="30">
                </a>
                <a href="https://www.apple.com/in/app-store/">
                    <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" alt="App Store" width="30">
                </a>
            </div>
        </div> 

        <div class="footer">
            <p>Please don't reply to this email ID as this email is not monitored. If you wish to contact us, kindly write to us at <a href="mailto:mankavit.clatcoaching11@gmail.com">mankavit.clatcoaching11@gmail.com</a>or through the contact us page.</p>
            
            <p>You are receiving this email because your email address was registered on our website. If you believe this was an error and you don't want to receive our emails, write to us at @ <a href="mailto:mankavit.clatcoaching11@gmail.com">mankavit.clatcoaching11@gmail.com</a> for deletion of your account.</p>
            

        </div>
    </div>
</body>
</html>

    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to:', studentEmail);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};

// Admin Notification Email
exports.sendAdminNotification = async (studentName, studentEmail, adminEmail) => {
    const mailOptions = {
        from: fromMail,
        to: adminEmail,
        subject: `New Student Registration – ${studentName} | ${studentEmail}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #2d3748;">Hello Admin,</h3>
        <p>A new student has enrolled in <strong>Mankavit Law Academy</strong>:</p>
        <ul>
          <li><strong>Name:</strong> ${studentName}</li>
          <li><strong>Email:</strong> ${studentEmail}</li>
          <li><strong>Signup Date:</strong> ${new Date().toLocaleDateString()}</li>
        </ul>
        <p><a href="${siteUrl}">Review profile on Admin Dashboard</a></p>
        <p style="margin-top: 20px;">Regards,<br>
        <strong>Mankavit System</strong></p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Admin notification email sent to:', adminEmail);
    } catch (error) {
        console.error('Error sending admin notification email:', error);
    }
};

exports.sendStudentKYCAcknowledgment = async (studentName, studentEmail) => {
    const mailOptions = {
        from: fromMail,
        to: studentEmail,
        subject: 'KYC Submitted Successfully | Mankavit Law Academy',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Dear ${studentName},</h2>
        <p>Thank you for submitting your <strong>KYC documents</strong> to Mankavit Law Academy. We have received your details and will verify them shortly.</p>
        
        <h3 style="color: #4a5568;">What’s Next?</h3>
        <ul>
          <li>✅ Your documents will be reviewed by our team.</li>
          <li>✅ You’ll receive a confirmation email once approved.</li>
          <li>✅ If additional details are needed, we’ll contact you.</li>
        </ul>

        <p><strong>Need help?</strong> Reply to this email or contact us at <a href="mailto:${supportMail}">${supportMail}</a>.</p>

        <p style="margin-top: 30px;">Best regards,<br>
        <strong>Team Mankavit Law Academy</strong><br>
        <a href=${siteUrl}">${siteUrl}</a></p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('KYC acknowledgment sent to student:', studentEmail);
    } catch (error) {
        console.error('Error sending student email:', error);
    }
};

exports.sendAdminKYCNofification = async (studentName, studentEmail, adminEmail) => {
    const mailOptions = {
        from: supportMail,
        to: adminEmail,
        subject: `New KYC Submission – ${studentName} | ${studentEmail}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h3 style="color: #2d3748;">Hello Admin,</h3>
        <p>A student has submitted <strong>KYC documents</strong> for verification:</p>
        <ul>
          <li><strong>Name:</strong> ${studentName}</li>
          <li><strong>Email:</strong> ${studentEmail}</li>
          <li><strong>Submission Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p><a href="${siteUrl}" style="background: #4299e1; color: white; padding: 8px 12px; text-decoration: none; border-radius: 4px;">Review KYC Now</a></p>
        <p style="margin-top: 20px;">Regards,<br>
        <strong>Mankavit System</strong></p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('KYC alert sent to admin:', adminEmail);
    } catch (error) {
        console.error('Error sending admin email:', error);
    }
};


exports.sendKYCApprovalEmail = async (studentName, studentEmail) => {
    const mailOptions = {
        from: fromMail,
        to: studentEmail,
        subject: 'Congratulations! Your KYC Has Been Approved',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Dear ${studentName},</h2>
        
        <p style="color: #38a169; font-weight: bold;">🎉 We're pleased to inform you that your KYC documents have been successfully verified and approved!</p>
        
        <p>You now have full access to all features of Mankavit Law Academy. Here's what you can do next:</p>
        
        <ul>
          <li>✅ Access all study materials and video lectures</li>
          <li>✅ Join live classes for LLM entrance preparation</li>
          <li>✅ Participate in mock tests and assessments</li>
        </ul>
        
        <p>If you have any questions, feel free to contact our support team.</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>Team Mankavit Law Academy</strong><br>
          <a href="${supportMail}">${supportMail}</a>
        </p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('KYC approval email sent to:', studentEmail);
    } catch (error) {
        console.error('Error sending KYC approval email:', error);
    }
};

exports.sendKYCRejectionEmail = async (studentName, studentEmail) => {
    const mailOptions = {
        from: fromMail,
        to: studentEmail,
        subject: 'KYC Verification - Action Required',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Dear ${studentName},</h2>
        
        <p style="color: #e53e3e; font-weight: bold;">We regret to inform you that your KYC submission could not be approved at this time.</p>
        
        
        
        <h3 style="color: #4a5568;">Next Steps:</h3>
        <ol>
          <li>Correct the issues in your documents</li>
          <li>Resubmit your KYC through your student dashboard</li>
        </ol>
        
        <p>If you need assistance, please contact our support team at <a href="mailto:${supportMail}">${supportMail}</a>.</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>Team Mankavit Law Academy</strong><br>
          <a href="${siteUrl}">${siteUrl}</a>
        </p>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('KYC rejection email sent to:', studentEmail);
    } catch (error) {
        console.error('Error sending KYC rejection email:', error);
    }
};

exports.sendCoursePurchaseEmail = async (studentName, studentEmail, courseName, amount, paymentId) => {
    const mailOptions = {
        from: fromMail,
        to: studentEmail,
        subject: `Course Purchase Confirmation - ${courseName}`,
        html: `
      <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Enrollment Confirmation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            background-color: #f5f7f9;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }
        .header {
            background: white;
            color: #2d3748;
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2d5b88;
        }
        .tagline {
            font-size: 18px;
            color: #4a5568;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 20px;
            color: #2d3748;
            margin-bottom: 20px;
        }
        .message {
            margin-bottom: 25px;
            font-size: 16px;
            line-height: 1.6;
        }
        .course-info {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
        }
        .course-name {
            font-weight: bold;
            color: #2d3748;
            font-size: 18px;
        }
        .instructions {
            margin: 25px 0;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        .instructions ol {
            padding-left: 20px;
            margin: 15px 0;
        }
        .instructions li {
            margin-bottom: 10px;
        }
        .app-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 25px 0;
            border: 1px solid #e2e8f0;
        }
        .app-title {
            font-size: 20px;
            color: #2d3748;
            margin-bottom: 15px;
        }
        .app-icons {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 15px 0;
        }
        .app-icon {
            display: inline-block;
            width: 135px;
            height: 40px;
        }
        .app-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .signature {
            margin-top: 25px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .signature-name {
            font-weight: bold;
            color: #2d3748;
        }
        .academy-name {
            font-weight: bold;
            color: #2d5b88;
        }
        .footer {
            background: #f8fafc;
            padding: 25px;
            font-size: 14px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer a {
            color: #2d5b88;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 20px 0;
        }
        .contact-info {
            margin: 15px 0;
            line-height: 1.8;
        }
        .highlight {
            color: #2d3748;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Mankavit Law Academy</div>
            <div class="tagline">Your Pathway to LLM Success</div>
        </div>

        <div class="content">
            <h2 class="greeting">Hi ${studentName},</h2>
            
            <div class="message">
                <p>Greetings from Mankavit Law Academy.</p>
                
                <div class="course-info">
                    <p>You are now enrolled into our course: <span class="course-name">${courseName}</span>.</p>
                </div>
                
                <p>You can access your course materials by logging into the website, going to your Dashboard → My Courses.</p>
                
                <p>If you wish to enroll into more courses, browse through our ongoing courses <a href="${siteUrl}">here</a>.</p>
            </div>

            <div class="signature">
                <p class="signature-name">Anuja Lal</p>
                <p class="academy-name">Mankavit Law Academy</p>
            </div>

            <div class="app-section">
                <h3 class="app-title">Download our Mobile App</h3>
                <div class="app-icons">
                    <a href="${playStoreLink}" class="app-icon">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/512px-Google_Play_Store_badge_EN.svg.png" alt="Get it on Google Play">
                    </a>
                    <a href="${appStoreLink}" class="app-icon">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/512px-Download_on_the_App_Store_Badge.svg.png" alt="Download on the App Store">
                    </a>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="divider"></div>
            
            <p>Please don't reply to this email ID as this email is not monitored. If you wish to contact us, kindly write to us @ <a href="mailto:mankavit.clatcoaching11@gmail.com">mankavit.clatcoaching11@gmail.com</a> or through the contact us page.</p>
            
            <p>You are receiving this email because your email address was registered on our website. If you believe this was an error and you don't want to receive our emails, write to us @ <a href="mailto:mankavit.clatcoaching11@gmail.com">mankavit.clatcoaching11@gmail.com</a> for deletion of your account.</p>
            
        </div>
    </div>
</body>
</html>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Course purchase email sent to:', studentEmail);
    } catch (error) {
        console.error('Error sending course purchase email:', error);
    }
};

exports.sendAdminCoursePurchaseNotification = async (studentName, studentEmail, courseName, amount, adminEmail) => {
    const mailOptions = {
        from: fromMail,
        to: adminEmail,
        subject: `New Course Purchase - ${courseName} by ${studentName}`,
        html: `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Purchase Notification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            background-color: #f5f7f9;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        .container {
            max-width: 650px;
            margin: 30px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }
        .header {
            background: linear-gradient(135deg, #1a3a5f, #2d5b88);
            color: white;
            padding: 25px 30px;
            text-align: center;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .subheading {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .intro {
            font-size: 16px;
            margin-bottom: 25px;
            color: #4a5568;
        }
        .purchase-details {
            background-color: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            width: 35%;
            color: #4a5568;
            font-weight: 500;
        }
        .detail-value {
            width: 65%;
            font-weight: 600;
            color: #2d3748;
        }
        .detail-value a {
            color: #2b6cb0;
            text-decoration: none;
            transition: color 0.2s;
        }
        .detail-value a:hover {
            color: #2c5282;
            text-decoration: underline;
        }
        .button-container {
            text-align: center;
            margin: 25px 0 15px;
        }
        .dashboard-btn {
            display: inline-block;
            background: #4299e1;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            transition: background 0.3s;
        }
        .dashboard-btn:hover {
            background: #3182ce;
        }
        .footer {
            padding: 25px;
            text-align: center;
            background: #f1f5f9;
            color: #64748b;
            font-size: 14px;
        }
        .regards {
            margin-top: 10px;
            color: #475569;
        }
        .system-name {
            font-weight: bold;
            color: #334155;
        }
        @media (max-width: 650px) {
            .container {
                margin: 15px;
                border-radius: 8px;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label, .detail-value {
                width: 100%;
            }
            .detail-label {
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Course Purchase Notification</h1>
            <p class="subheading">Mankavit Law Academy</p>
        </div>
        
        <div class="content">
            <p class="intro">A student has enrolled in a course. Find the details below:</p>
            
            <div class="purchase-details">
                <div class="detail-row">
                    <div class="detail-label">Student Name:</div>
                    <div class="detail-value">
                        <a href="#">${studentName}</a>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Course Name:</div>
                    <div class="detail-value">
                        <a href="#">${courseName}</a>
                    </div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Amount Paid:</div>
                    <div class="detail-value">₹${amount}</div>
                </div>
            </div>
            
            <div class="button-container">
                <a href="${siteUrl}/admin/student-management" class="dashboard-btn">View Student Dashboard</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated notification. Please do not reply to this message.</p>
            <p class="regards">Regards,<br>
            <span class="system-name">Mankavit System</span></p>
        </div>
    </div>
</body>
</html>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Admin notification sent for course purchase');
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
};

exports.sendMockTestSubmissionAlert = async (studentName, studentEmail, testName, attemptNumber, MCQscore, adminEmail, attemptId) => {
    const mailOptions = {
        from: fromMail,
        to: adminEmail,
        subject: `Mock Test Submitted: ${studentName} - Attempt ${attemptNumber}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Mock Test Submission Alert</h2>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #4a5568; margin-top: 0;">Test Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; width: 40%;"><strong>Student Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${studentEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Mock Test Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${testName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Attempt Number:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="background-color: ${attemptNumber > 1 ? '#f6ad55' : '#68d391'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.9em;">
                  Attempt ${attemptNumber}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>MCQ Score:</strong></td>
              <td style="padding: 8px 0;">
                <span style="font-weight: bold; color:  '#38a169';">
                  ${MCQscore}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin: 25px 0;">
          <a href="https://mankavit-frontend.vercel.app/admin/results/user-attempts/attempt/${attemptId}" 
             style="background-color: #4299e1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Detailed Report
          </a>
        </div>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 0.9em; color: #718096;">
          <p>This is an automated notification. No action is required unless you notice anomalies.</p>
          <p>Regards,<br><strong>Mankavit Assessment System</strong></p>
        </div>
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Mock test alert sent to admin for ${studentName}'s attempt ${attemptNumber}`);
    } catch (error) {
        console.error('Error sending mock test alert:', error);
    }
};

exports.sendQuestionPaperDownloadAlert = async (userName, userEmail, userPhone, adminEmail) => {
    const mailOptions = {
        from: fromMail,
        to: adminEmail,
        subject: `Question Paper Downloaded`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Question Paper Download Alert</h2>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #4a5568; margin-top: 0;">Download Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; width: 40%;"><strong>User Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${userPhone}</td>
            </tr>
           
          </table>
        </div>

        <div style="margin: 25px 0;">
          <a href="${siteUrl}/admin/downloads" 
             style="background-color: #4299e1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Download History
          </a>
        </div>

        
      </div>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Download alert sent to admin for ${userName}'s download of Question Paper `);
    } catch (error) {
        console.error('Error sending download alert:', error);
        throw error; // Optional: rethrow if you want calling code to handle it
    }
};


exports.sendContactUsMailToAdmin = async (name, email, message, adminEmail) => {
    const mailOptions = {
        from: fromMail,
        to: adminEmail,
        subject: `Contact Us Form Submission`,
        html: `
     <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Message</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            background-color: #f5f7f9;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }
        .header {
            /* background: linear-gradient(135deg, #1a3a5f, #2d5b88); */
            /* color: white; */
            padding: 25px 30px;
            text-align: center;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .subheading {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .intro {
            font-size: 16px;
            margin-bottom: 25px;
            color: #4a5568;
        }
        .message-details {
            background-color: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            width: 30%;
            color: #4a5568;
            font-weight: 500;
        }
        .detail-value {
            width: 70%;
            font-weight: 600;
            color: #2d3748;
        }
        .message-content {
            background-color: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .message-text {
            font-size: 16px;
            line-height: 1.6;
            color: #4a5568;
            white-space: pre-wrap;
        }
        .button-container {
            text-align: center;
            margin: 25px 0 15px;
        }
        .reply-btn {
            display: inline-block;
            background: #4299e1;
            color: white;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            transition: background 0.3s;
        }
        .reply-btn:hover {
            background: #3182ce;
        }
        .footer {
            padding: 25px;
            text-align: center;
            background: #f1f5f9;
            color: #64748b;
            font-size: 14px;
        }
        .system-name {
            font-weight: bold;
            color: #334155;
        }
        @media (max-width: 650px) {
            .container {
                margin: 15px;
                border-radius: 8px;
            }
            .detail-row {
                flex-direction: column;
            }
            .detail-label, .detail-value {
                width: 100%;
            }
            .detail-label {
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Contact Form Message</h1>
            <p class="subheading">Mankavit Law Academy</p>
        </div>
        
        <div class="content">
            <p class="intro">You have received the following message through the contact form:</p>
            
            <div class="message-details">
                <div class="detail-row">
                    <div class="detail-label">From:</div>
                    <div class="detail-value">${name}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Email:</div>
                    <div class="detail-value">${email}</div>
                </div>
                
                <div class="detail-row">
                    <div class="detail-label">Date:</div>
                    <div class="detail-value">${new Date().toLocaleString()}</div>
                </div>
            </div>
            
            <div class="message-content">
                <h3 style="color: #4a5568; margin-bottom: 15px;">Message:</h3>
                <p class="message-text">${message}</p>
            </div>
            
            <div class="button-container">
                <a href="mailto:${email}" class="reply-btn">Reply to ${name}</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated notification. Please do not reply to this message.</p>
            <p>© 2023 <span class="system-name">Mankavit System</span>. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Contact us form sent to admin for ${name}`);
    } catch (error) {
        console.error('Error sending contact us form:', error);
        throw error; // Optional: rethrow if you want calling code to handle it
    }
};

exports.sendAdminPaperDownloadMail = async (name, email, phone, adminEmail) => {
    try {
        const mailOptions = {
            from: fromMail,
            to: adminEmail,
            subject: `New 'Previous Year Questions' page visitor`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h3 style="color: #2d3748;">Hi,</h3>
          <p>the following user visited the 'Previous Year Questions' page of Mankavit website:</p>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Phone:</strong> ${phone}</li>
          </ul>
          
          <p>Best regards,<br>
          <strong>Mankavit System</strong></p>
        </div>
      `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Contact us form sent to admin for ${name}`);
    } catch (error) {
        console.error('Error sending contact us form:', error);
        throw error; // Optional: rethrow if you want calling code to handle it
    }
}

exports.sendwelcomeMailtoStudentAdminCreated = async (studentName, email, password,) => {
    try {
        const mailOptions = {
            from: fromMail,
            to: email,
            subject: `New Student Registered`,
            html: `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Mankavit Law Academy</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 10px;
        }
        h2 {
            color: #2d3748;
            margin-top: 0;
        }
        .highlight {
            color: #4a5568;
            font-weight: bold;
        }
        .credentials {
            background-color: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-row {
            display: flex;
            margin-bottom: 10px;
        }
        .credential-label {
            width: 100px;
            font-weight: bold;
        }
        .credential-value {
            flex: 1;
            font-family: monospace;
            background-color: #edf2f7;
            padding: 5px 10px;
            border-radius: 4px;
        }
        .app-download {
            text-align: center;
            margin: 25px 0;
            padding: 15px;
            background-color: #f7fafc;
            border-radius: 6px;
        }
        .app-icons {
            margin: 15px 0;
        }
        .app-icons a {
            margin: 0 10px;
            text-decoration: none;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #718096;
        }
        .signature {
            margin-top: 25px;
            font-style: italic;
        }
        a {
            color: #4299e1;
            text-decoration: underline;
        }
        .note {
            font-style: italic;
            color: #718096;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Mankavit Law Academy</div>
            <p>Your trusted partner in cracking CLAT LLM, DU LLM, AILET LLM, and other prestigious LLM entrance exams</p>
        </div>

        <h2>Hi ${studentName},</h2>
        
        <p>Welcome to Mankavit Law Academy, the best place for LL.M. Entrance Exam preparations.</p>
        
        <p>As per your request, your account was created on Mankavit Law Academy website. You can use the below credentials for logging into our website. We suggest you to change the password on your first login.</p>
        
        <div class="credentials">
            <div class="credential-row">
                <div class="credential-label">Username:</div>
                <div class="credential-value">${email}</div>
            </div>
            <div class="credential-row">
                <div class="credential-label">Password:</div>
                <div class="credential-value">${password}</div>
            </div>
        </div>
        
        <p class="note">We strongly recommend changing your password after your first login for security purposes.</p>
        
        <p>Browse through our ongoing courses <a href="https://mankavit-frontend.vercel.app/">here</a>.</p>

        <div class="signature">
            <p>Warm regards,<br>
            <strong>Anuja Lal</strong><br>
            Mankavit Law Academy</p>
        </div>

        <div class="app-download">
            <h3>Download our Mobile App</h3>
            <div class="app-icons">
                <a href="https://play.google.com/store/games?hl=en_IN">
                    <img src="https://cdn-icons-png.flaticon.com/512/300/300218.png" alt="Google Play" width="30">
                </a>
                <a href="https://www.apple.com/in/app-store/">
                    <img src="https://cdn-icons-png.flaticon.com/512/300/300221.png" alt="App Store" width="30">
                </a>
            </div>
        </div> 

        <div class="footer">
            <p>Please don't reply to this email ID as this email is not monitored. If you wish to contact us, kindly write to us at <a href="mailto:mankavit.clatcoaching11@gmail.com">mankavit.clatcoaching11@gmail.com</a> or through the contact us page.</p>
            
            <p>You are receiving this email because your email address was registered on our website. If you believe this was an error and you don't want to receive our emails, write to us at <a href="mailto:mankavit.clatcoaching11@gmail.com">mankavit.clatcoaching11@gmail.com</a> for deletion of your account.</p>
        </div>
    </div>
</body>
</html>
      `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Contact us form sent to admin for ${studentName}`);
    } catch (error) {
        console.error('Error sending contact us form:', error);
        throw error; // Optional: rethrow if you want calling code to handle it
    }
}

exports.admincreateStudentMailtoadmins = async (name, email, phone, date_of_birth, age, college_name, passing_year, current_occupation, fathers_name, fathers_occupation, present_address, adminEmail) => {
    try {
        const mailOptions = {
            from: fromMail,
            to: adminEmail,
            subject: `New Student Created By Admin`,
            html: `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Student Registration Notification</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            background-color: #f5f7f9;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        }
        .header {
            /* background: linear-gradient(135deg, #1a3a5f, #2d5b88); */
            /* color: white; */
            padding: 25px 30px;
            text-align: center;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
        }
        .subheading {
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .intro {
            font-size: 16px;
            margin-bottom: 25px;
            color: #4a5568;
        }
        .student-info {
            background-color: #f8f9fa;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-section {
            margin-bottom: 20px;
        }
        .section-title {
            color: #2d3748;
            font-size: 18px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        @media (max-width: 600px) {
            .detail-grid {
                grid-template-columns: 1fr;
            }
        }
        .detail-item {
            margin-bottom: 12px;
        }
        .detail-label {
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 5px;
        }
        .detail-value {
            color: #2d3748;
            word-break: break-word;
        }
        .action-buttons {
            display: flex;
            gap: 15px;
            margin: 25px 0;
            flex-wrap: wrap;
        }
        .action-btn {
            display: inline-block;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s;
        }
        .view-profile {
            background: #4299e1;
            color: white;
        }
        .view-profile:hover {
            background: #3182ce;
        }
        .view-kyc {
            background: #48bb78;
            color: white;
        }
        .view-kyc:hover {
            background: #38a169;
        }
        .footer {
            padding: 25px;
            text-align: center;
            background: #f1f5f9;
            color: #64748b;
            font-size: 14px;
        }
        .system-name {
            font-weight: bold;
            color: #334155;
        }
        .timestamp {
            margin-top: 10px;
            font-size: 14px;
            color: #718096;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Student Registration</h1>
            <p class="subheading">Mankavit Law Academy</p>
        </div>
        
        <div class="content">
            <p class="intro">A new student has been registered in the system. Below are the details:</p>
            
            <div class="student-info">
                <div class="info-section">
                    <h3 class="section-title">Basic Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Full Name:</div>
                            <div class="detail-value">${name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Email:</div>
                            <div class="detail-value">${email}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Phone:</div>
                            <div class="detail-value">${phone}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Date of Birth:</div>
                            <div class="detail-value">${date_of_birth}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Age:</div>
                            <div class="detail-value">${age}</div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3 class="section-title">Educational Background</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">College Name:</div>
                            <div class="detail-value">${college_name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Passing Year:</div>
                            <div class="detail-value">${passing_year}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Current Occupation:</div>
                            <div class="detail-value">${current_occupation}</div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3 class="section-title">Family Information</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">Father's Name:</div>
                            <div class="detail-value">${fathers_name}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Father's Occupation:</div>
                            <div class="detail-value">${fathers_occupation}</div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3 class="section-title">Address</h3>
                    <div class="detail-item">
                        <div class="detail-label">Present Address:</div>
                        <div class="detail-value">${present_address}</div>
                    </div>
                </div>
                
               
            </div>
           
            
            <div class="timestamp">
                <p>Registration completed on: ${new Date().toLocaleString()}</p>
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from the Mankavit Law Academy system.</p>
            <p>© 2023 <span class="system-name">Mankavit System</span>. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
      `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Contact us form sent to admin for ${name}`);
    } catch (error) {
        console.error('Error sending contact us form:', error);
        throw error; // Optional: rethrow if you want calling code to handle it
    }
}

exports.meetingScheduledMail = async (meeting, hostEmail, studentEmails) => {
    try {
        const formattedDate = new Date(meeting.meeting_time).toLocaleString();
        console.log("hostEmail", hostEmail,"studentEmails",studentEmails);
        // Mail to Host
        const hostMail = {
            from: fromMail,
            to: hostEmail,
            subject: `Meeting Scheduled: ${meeting.meeting_title}`,
            html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <h2>📅 Meeting Scheduled</h2>
        <p>Hello,</p>
        <p>Your meeting has been successfully scheduled. Below are the details:</p>
        
        <div style="padding:12px; border:1px solid #eee; border-radius:6px; background:#fafafa;">
          <p><b>Title:</b> ${meeting.meeting_title}</p>
          <p><b>Agenda:</b> ${meeting.meeting_agenda}</p>
          <p><b>Time:</b> ${formattedDate}</p>
          <p><b>Duration:</b> ${meeting.meeting_duration} minutes</p>
        </div>
        <p>
         Regards,<br>
         <strong>Team Mankavit Law Academy</strong><br>
         <a href="${siteUrl}">${siteUrl}</a>
        </p>
        
      </div>
      `
        };

        // Mail to Students
        const studentMail = {
            from: fromMail,
            bcc: studentEmails, // bcc so all don’t see each other
            subject: `Join Meeting: ${meeting.meeting_title}`,
            html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <h2>🎓 Meeting Invitation</h2>
        <p>Dear Student,</p>
        <p>You are invited to join the scheduled meeting. Please find the details below:</p>

        <div style="padding:12px; border:1px solid #eee; border-radius:6px; background:#fafafa;">
          <p><b>Title:</b> ${meeting.meeting_title}</p>
          <p><b>Agenda:</b> ${meeting.meeting_agenda}</p>
          <p><b>Time:</b> ${formattedDate}</p>
          <p><b>Duration:</b> ${meeting.meeting_duration} minutes</p>
        </div>

        <p>
         Regards,<br>
         <strong>Team Mankavit Law Academy</strong><br>
         <a href="${siteUrl}">${siteUrl}</a>
        </p>
        
      </div>
      `
        };

        await transporter.sendMail(hostMail);
        await transporter.sendMail(studentMail);

        console.log(`Meeting scheduled emails sent for: ${meeting.meeting_title}`);
    } catch (error) {
        console.error("Error sending meeting scheduled mail:", error);
        throw error;
    }
};

exports.meetingCancelledMail = async (meeting, hostEmail, studentEmails) => {
    try {
        const formattedDate = new Date(meeting.meeting_time).toLocaleString();

        // Mail to Host
        const hostMail = {
            from: fromMail,
            to: "jayanthbychana@gmail.com",
            subject: `Meeting Cancelled: ${meeting.meeting_title}`,
            html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <h2>⚠️ Meeting Cancelled</h2>
        <p>The following meeting has been cancelled:</p>
        
        <div style="padding:12px; border:1px solid #eee; border-radius:6px; background:#fafafa;">
          <p><b>Title:</b> ${meeting.meeting_title}</p>
          <p><b>Agenda:</b> ${meeting.meeting_agenda}</p>
          <p><b>Originally Scheduled At:</b> ${formattedDate}</p>
        </div>
      </div>
       <p>
         Regards,<br>
         <strong>Team Mankavit Law Academy</strong><br>
         <a href="${siteUrl}">${siteUrl}</a>
        </p>
      `
        };

        // Mail to Students
        const studentMail = {
            from: fromMail,
            bcc: studentEmails,
            subject: `Meeting Cancelled: ${meeting.meeting_title}`,
            html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        <h2>⚠️ Meeting Cancelled</h2>
        <p>Dear Student,</p>
        <p>The following meeting has been cancelled. Please stay tuned for updates:</p>

        <div style="padding:12px; border:1px solid #eee; border-radius:6px; background:#fafafa;">
          <p><b>Title:</b> ${meeting.meeting_title}</p>
          <p><b>Agenda:</b> ${meeting.meeting_agenda}</p>
          <p><b>Originally Scheduled At:</b> ${formattedDate}</p>
        </div>
      </div>
       <p>
         Regards,<br>
         <strong>Team Mankavit Law Academy</strong><br>
         <a href="${siteUrl}">${siteUrl}</a>
        </p>
      `
        };

        await transporter.sendMail(hostMail);
        await transporter.sendMail(studentMail);

        console.log(`Meeting cancelled emails sent for: ${meeting.meeting_title}`);
    } catch (error) {
        console.error("Error sending meeting cancelled mail:", error);
        throw error;
    }
};

