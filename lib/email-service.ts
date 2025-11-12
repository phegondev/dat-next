import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Template directory
const TEMPLATE_DIR = path.join(process.cwd(), 'lib', 'email-templates')

interface EmailOptions {
  to: string
  subject: string
  template: string
  variables: Record<string, any>
}

export async function sendEmail(options: EmailOptions) {
  try {
    // Read template file
    const templatePath = path.join(TEMPLATE_DIR, `${options.template}.html`)

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template '${options.template}' not found at ${templatePath}`)
    }

    let templateContent = fs.readFileSync(templatePath, 'utf8')

    // Add current year to variables
    const allVariables = {
      ...options.variables,
      currentYear: new Date().getFullYear()
    }

    // Replace variables in template
    for (const [key, value] of Object.entries(allVariables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g')
      templateContent = templateContent.replace(placeholder, String(value))
    }

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: templateContent,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email sent successfully to ${options.to}`)
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

// Specific email functions for common use cases
export const emailService = {

  sendWelcomeEmail: async (to: string, name: string) => {
    const loginLink = `${process.env.APP_URL}/auth/login`

    await sendEmail({
      to,
      subject: 'Welcome to DAT Health!',
      template: 'welcome',
      variables: {
        name,
        loginLink
      }
    })
  },

  sendPasswordResetEmail: async (to: string, name: string, code: string) => {
    const resetLink = `${process.env.APP_URL}/auth/reset-password?code=${code}`

    await sendEmail({
      to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      variables: {
        name,
        resetLink
      }
    })
  },

  sendPasswordUpdateConfirmation: async (to: string, name: string) => {
    await sendEmail({
      to,
      subject: 'Password Updated Successfully',
      template: 'password-update-confirmation',
      variables: {
        name
      }
    })
  },

  sendPassrdChangeAlert: async (to: string, name: string) => {
    await sendEmail({
      to,
      subject: 'Security Alert: Password Changed',
      template: 'password-change',
      variables: {
        name,
        changeTime: new Date().toLocaleString()
      }
    })
  },

  sendDoctorAppointmentNotification: async (to: string, variables: any) => {
    await sendEmail({
      to,
      subject: 'New Appointment Scheduled',
      template: 'doctor-appointment',
      variables
    })
  },

  sendPatientAppointmentConfirmation: async (to: string, variables: any) => {
    await sendEmail({
      to,
      subject: 'Appointment Confirmed',
      template: 'patient-appointment',
      variables
    })
  },

  sendAppointmentCancellation: async (to: string, variables: any) => {
    await sendEmail({
      to,
      subject: 'Appointment Cancellation',
      template: 'appointment-cancellation',
      variables
    })
  }
}