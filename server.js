const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const validator = require('validator');
const xss = require('xss');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // limit each IP to 25 requests per windowMs
  message: {
    error: 'Too many contact form submissions, please try again later.',
    status: 'rate_limit_exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Email transporter setup
const createTransporter = () => {
  // Gmail configuration (you can change this to your email provider)
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use App Password for Gmail
    },
    secure: true,
  });
};

// Validation middleware
const validateContactForm = (req, res, next) => {
  const { name, email, subject, message } = req.body;
  const errors = {};

  // Sanitize inputs
  const sanitizedData = {
    name: xss(name?.toString().trim() || ''),
    email: xss(email?.toString().trim() || ''),
    subject: xss(subject?.toString().trim() || ''),
    message: xss(message?.toString().trim() || '')
  };

  // Name validation
  if (!sanitizedData.name) {
    errors.name = 'Name is required';
  } else if (sanitizedData.name.length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (sanitizedData.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }

  // Email validation
  if (!sanitizedData.email) {
    errors.email = 'Email is required';
  } else if (!validator.isEmail(sanitizedData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Subject validation
  if (!sanitizedData.subject) {
    errors.subject = 'Subject is required';
  } else if (sanitizedData.subject.length < 5) {
    errors.subject = 'Subject must be at least 5 characters long';
  } else if (sanitizedData.subject.length > 200) {
    errors.subject = 'Subject must be less than 200 characters';
  }

  // Message validation
  if (!sanitizedData.message) {
    errors.message = 'Message is required';
  } else if (sanitizedData.message.length < 10) {
    errors.message = 'Message must be at least 10 characters long';
  } else if (sanitizedData.message.length > 1000) {
    errors.message = 'Message must be less than 1000 characters';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  // Attach sanitized data to request
  req.sanitizedBody = sanitizedData;
  next();
};

// Email templates
const createEmailTemplates = (data) => {
  const { name, email, subject, message } = data;
  
  // Email to you (notification)
  const notificationEmail = {
    from: `"Contact Form" <${process.env.EMAIL_USER}>`,
    to: process.env.RECIPIENT_EMAIL || process.env.EMAIL_USER,
    subject: `New Contact Form Submission: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
          <h3 style="color: #333; margin-top: 0;">Message</h3>
          <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
          <p style="margin: 0; color: #1976d2; font-size: 14px;">
            <strong>Sent:</strong> ${new Date().toLocaleString()}<br>
            <strong>IP:</strong> ${req.ip || 'Unknown'}<br>
            <strong>User Agent:</strong> ${req.get('User-Agent') || 'Unknown'}
          </p>
        </div>
      </div>
    `,
    text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

Sent: ${new Date().toLocaleString()}
    `
  };

  // Auto-reply email to sender
  const autoReplyEmail = {
    from: `"Yassine Chadani" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Thank you for contacting me - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Thank You for Reaching Out!</h1>
        </div>
        
        <div style="padding: 20px;">
          <p style="font-size: 16px; color: #333;">Hi ${name},</p>
          
          <p style="line-height: 1.6; color: #555;">
            Thank you for your message! I've received your contact form submission and will get back to you as soon as possible, typically within 24-48 hours.
          </p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Message Summary:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong> ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}</p>
          </div>
          
          <p style="line-height: 1.6; color: #555;">
            In the meantime, feel free to connect with me on social media or explore my portfolio for more information about my work.
          </p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="mailto:yassinechadani113@gmail.com" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply to This Email</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>Yassine Chadani</strong><br>
            Full Stack Developer
          </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 12px;">
          <p>This is an automated response. Please do not reply to this email directly.</p>
        </div>
      </div>
    `,
    text: `
Hi ${name},

Thank you for your message! I've received your contact form submission and will get back to you as soon as possible, typically within 24-48 hours.

Your Message Summary:
Subject: ${subject}
Message: ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}

Best regards,
Yassine Chadani
Full Stack Developer
    `
  };

  return { notificationEmail, autoReplyEmail };
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Contact Form API'
  });
});

app.post('/api/contact', contactLimiter, validateContactForm, async (req, res) => {
  try {
    const { name, email, subject, message } = req.sanitizedBody;
    
    // Create transporter
    const transporter = createTransporter();
    
    // Verify transporter
    await transporter.verify();
    
    // Create email templates
    const { notificationEmail, autoReplyEmail } = createEmailTemplates(
      { name, email, subject, message }
    );
    
    // Send notification email
    await transporter.sendMail(notificationEmail);
    
    // Send auto-reply email
    await transporter.sendMail(autoReplyEmail);
    
    // Log successful submission (you might want to save to database here)
    console.log(`Contact form submission from ${name} (${email}) at ${new Date().toISOString()}`);
    
    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! I\'ll get back to you soon.',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    
    // Different error messages based on error type
    let errorMessage = 'There was an error sending your message. Please try again later.';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please try again later.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection error. Please check your internet connection and try again.';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Contact Form API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Email configured: ${process.env.EMAIL_USER ? 'Yes' : 'No'}`);
});

module.exports = app;