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

// Enhanced logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
}));

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'https://mail-service-murex.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow all origins for now - you can restrict this later
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many contact form submissions, please try again later.',
    status: 'rate_limit_exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Enhanced Email transporter setup with better error handling
const createTransporter = () => {
  // Check if required environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER and EMAIL_PASS environment variables are required!');
    console.log('Current EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
    console.log('Current EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
    throw new Error('Email configuration missing');
  }

  console.log('📧 Creating email transporter with Gmail...');
  console.log('Email User:', process.env.EMAIL_USER);
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use App Password for Gmail
    },
    secure: true,
    debug: true, // Enable debug logging
    logger: true // Enable logging
  });
};

// Test email configuration function
const testEmailConfig = async () => {
  try {
    console.log('🧪 Testing email configuration...');
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration is valid!');
    return true;
  } catch (error) {
    console.error('❌ Email configuration test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide specific guidance based on error type
    if (error.code === 'EAUTH') {
      console.error('🔑 Authentication failed. Please check:');
      console.error('1. EMAIL_USER is correct Gmail address');
      console.error('2. EMAIL_PASS is an App Password (not regular password)');
      console.error('3. 2-Step Verification is enabled on Gmail');
      console.error('4. App Password was generated correctly');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Connection failed. Please check your internet connection.');
    }
    
    return false;
  }
};

// Validation middleware
const validateContactForm = (req, res, next) => {
  console.log('📝 Validating contact form data:', req.body);
  
  const { name, email, subject, message } = req.body;
  const errors = {};

  // Sanitize inputs
  const sanitizedData = {
    name: xss(name?.toString().trim() || ''),
    email: xss(email?.toString().trim() || ''),
    subject: xss(subject?.toString().trim() || ''),
    message: xss(message?.toString().trim() || '')
  };

  console.log('🧹 Sanitized data:', sanitizedData);

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
    console.log('❌ Validation failed:', errors);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors
    });
  }

  console.log('✅ Validation passed');
  // Attach sanitized data to request
  req.sanitizedBody = sanitizedData;
  next();
};

// Email templates
const createEmailTemplates = (data, req) => {
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
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Contact Form API',
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

// Enhanced debug endpoint
app.get('/api/debug', (req, res) => {
  console.log('🔍 Debug information requested');
  res.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: PORT,
      EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'Set (App Password?)' : 'Not set',
      RECIPIENT_EMAIL: process.env.RECIPIENT_EMAIL || 'Using EMAIL_USER as recipient'
    },
    timestamp: new Date().toISOString()
  });
});

// Test email endpoint
app.post('/api/test-email', async (req, res) => {
  console.log('📧 Testing email configuration...');
  
  try {
    const transporter = createTransporter();
    
    // Test connection
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    
    // Send test email
    const testEmail = {
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email - Contact Form API',
      text: `Test email sent at ${new Date().toISOString()}`,
      html: `<p>Test email sent at <strong>${new Date().toISOString()}</strong></p>`
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully:', result.messageId);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/contact', contactLimiter, validateContactForm, async (req, res) => {
  console.log('📮 Processing contact form submission...');
  
  try {
    const { name, email, subject, message } = req.sanitizedBody;
    
    console.log('👤 Contact from:', name, email);
    console.log('📄 Subject:', subject);
    
    // Create transporter
    console.log('🔧 Creating email transporter...');
    const transporter = createTransporter();
    
    // Verify transporter
    console.log('🔍 Verifying email configuration...');
    await transporter.verify();
    console.log('✅ Email transporter verified');
    
    // Create email templates
    console.log('📝 Creating email templates...');
    const { notificationEmail, autoReplyEmail } = createEmailTemplates(
      { name, email, subject, message },
      req
    );
    
    console.log('📧 Sending notification email to:', notificationEmail.to);
    
    // Send notification email
    const notificationResult = await transporter.sendMail(notificationEmail);
    console.log('✅ Notification email sent:', notificationResult.messageId);
    
    console.log('📧 Sending auto-reply email to:', autoReplyEmail.to);
    
    // Send auto-reply email
    const autoReplyResult = await transporter.sendMail(autoReplyEmail);
    console.log('✅ Auto-reply email sent:', autoReplyResult.messageId);
    
    // Log successful submission
    console.log(`✅ Contact form submission completed from ${name} (${email}) at ${new Date().toISOString()}`);
    
    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! I\'ll get back to you soon.',
      timestamp: new Date().toISOString(),
      messageIds: {
        notification: notificationResult.messageId,
        autoReply: autoReplyResult.messageId
      }
    });
    
  } catch (error) {
    console.error('❌ Contact form error:', error);
    console.error('Error stack:', error.stack);
    
    // Different error messages based on error type
    let errorMessage = 'There was an error sending your message. Please try again later.';
    let statusCode = 500;
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please contact the administrator.';
      console.error('🔑 Gmail authentication failed. Check App Password!');
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection error. Please check your internet connection and try again.';
      console.error('🌐 Network connection failed');
    } else if (error.message.includes('Email configuration missing')) {
      errorMessage = 'Server configuration error. Please contact the administrator.';
      console.error('⚙️ Email configuration missing');
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        message: error.message
      } : undefined
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Global error:', error);
  console.error('Error stack:', error.stack);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server with enhanced logging
app.listen(PORT, async () => {
  console.log('🚀 Contact Form API server starting...');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 Email User: ${process.env.EMAIL_USER || 'Not configured'}`);
  console.log(`🔑 Email Pass: ${process.env.EMAIL_PASS ? 'Configured' : 'Not configured'}`);
  console.log(`📮 Recipient: ${process.env.RECIPIENT_EMAIL || process.env.EMAIL_USER || 'Not configured'}`);
  
  // Test email configuration on startup
  console.log('\n' + '='.repeat(50));
  const emailTest = await testEmailConfig();
  if (emailTest) {
    console.log('✅ Server ready to handle contact form submissions!');
  } else {
    console.log('❌ Server started but email configuration has issues!');
    console.log('🔧 Please fix email configuration before using contact form');
  }
  console.log('='.repeat(50) + '\n');
});

module.exports = app;