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
const  siteUrl = "https://mankavit-frontend.vercel.app/";
const contactNumber = "+91-7979700796";

exports.sendWelcomeEmail = async (studentName, studentEmail) => {
    const mailOptions = {
        from: fromMail,
        to: studentEmail,
        subject: 'Welcome to Mankavit Law Academy – Your Path to LLM Success Starts Here!',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d3748;">Dear ${studentName},</h2>
        <p>We are delighted to welcome you to <strong>Mankavit Law Academy</strong> – your trusted partner in cracking <strong>CLAT LLM, DU LLM, AILET LLM, and other prestigious LLM entrance exams</strong>!</p>
        
       
        <p><strong>Our promise:</strong> We’re as invested in your success as you are!</p>

       

        <p>Need help? Reply to this email or visit our <a href="${siteUrl}">Support Page</a>.</p>

        <p style="margin-top: 30px;">Warm regards,<br>
        <strong>Team Mankavit Law Academy</strong><br>
        ${supportMail} | ${siteUrl} | ${contactNumber}</p>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          <h2 style="color: #2d3748; text-align: center;">Thank You for Your Purchase!</h2>
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background-color: #38a169; color: white; padding: 10px 20px; border-radius: 5px; font-weight: bold;">
              Payment Successful
            </div>
          </div>
          
          <p>Dear ${studentName},</p>
          
          <p>We're excited to confirm your enrollment in <strong>${courseName}</strong> at Mankavit Law Academy.</p>
          
          <div style="background-color: white; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="color: #4a5568; margin-top: 0;">Order Details</h3>
            <table style="width: 100%;">
              <tr>
                <td style="padding: 5px 0; width: 40%;">Course Name:</td>
                <td style="padding: 5px 0; font-weight: bold;">${courseName}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">Amount Paid:</td>
                <td style="padding: 5px 0; font-weight: bold;">₹${amount}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">Payment ID:</td>
                <td style="padding: 5px 0; font-weight: bold;">${paymentId}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;">Purchase Date:</td>
                <td style="padding: 5px 0; font-weight: bold;">${new Date().toLocaleDateString()}</td>
              </tr>
            </table>
          </div>
          
          <h3 style="color: #4a5568;">Your Next Steps</h3>
          <ol>
            <li>Access your course materials: <a href="${siteUrl}" style="color: #4299e1;">Click here to begin learning</a></li>
            <li>Join our student community for discussions</li>
            <li>Check your email for class schedules</li>
          </ol>
          
          <p>If you have any questions about your course, please contact our support team.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p>Best regards,<br>
            <strong>Team Mankavit Law Academy</strong></p>
            <p style="font-size: 0.9em; color: #718096;">
              Contact: ${fromMail}<br>
              Phone: ${contactNumber}<br>
              Website: <a href="${siteUrl}" style="color: #4299e1;">${siteUrl}</a>
            </p>
          </div>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2d3748;">New Course Purchase Notification</h2>
        
        <p>A student has purchased a course:</p>
        
        <div style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #4a5568; margin-top: 0;">Purchase Details</h3>
          <table style="width: 100%;">
            <tr>
              <td style="padding: 5px 0; width: 30%;">Student Name:</td>
              <td style="padding: 5px 0; font-weight: bold;">${studentName}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">Student Email:</td>
              <td style="padding: 5px 0; font-weight: bold;">${studentEmail}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">Course:</td>
              <td style="padding: 5px 0; font-weight: bold;">${courseName}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">Amount:</td>
              <td style="padding: 5px 0; font-weight: bold;">₹${amount}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0;">Purchase Date:</td>
              <td style="padding: 5px 0; font-weight: bold;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 20px;">
          <a href="${siteUrl}" style="background-color: #4299e1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Student Dashboard
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p>Regards,<br>
          <strong>Mankavit System</strong></p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Admin notification sent for course purchase');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

exports.sendMockTestSubmissionAlert = async (studentName, studentEmail, testName, attemptNumber, MCQscore, adminEmail) => {
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
          <a href="${siteUrl}" 
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