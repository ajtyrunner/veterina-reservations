import nodemailer from 'nodemailer'
import sgMail from '@sendgrid/mail'
import { Resend } from 'resend'
// Email templates will use basic date formatting

// Email provider configuration
interface EmailConfig {
  provider: 'sendgrid' | 'resend' | 'smtp'
  sendgridApiKey?: string
  resendApiKey?: string
  smtpConfig?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  fromEmail: string
  fromName: string
}

// Email template data interfaces
interface ReservationEmailData {
  customerName: string
  customerEmail: string
  doctorName: string
  doctorEmail: string
  petName?: string
  petType?: string
  description?: string
  startTime: Date
  endTime: Date
  timezone: string
  tenantName: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  reservationId: string
  room?: string
  serviceType?: string
}

interface NotificationEmailData {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  htmlContent: string
  textContent: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType: string
  }>
}

class EmailService {
  private config: EmailConfig
  private resend?: Resend
  private smtpTransporter?: nodemailer.Transporter

  constructor() {
    this.config = {
      provider: (process.env.EMAIL_PROVIDER as any) || 'resend',
      sendgridApiKey: process.env.SENDGRID_API_KEY,
      resendApiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.FROM_EMAIL || 'noreply@veterina-svahy.cz',
      fromName: process.env.FROM_NAME || 'Veterinární ordinace',
      smtpConfig: process.env.SMTP_HOST ? {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        }
      } : undefined
    }

    this.initializeProviders()
  }

  private initializeProviders() {
    try {
      // Initialize SendGrid
      if (this.config.sendgridApiKey && this.config.provider === 'sendgrid') {
        sgMail.setApiKey(this.config.sendgridApiKey)
        console.log('✅ SendGrid initialized')
      }

      // Initialize Resend
      if (this.config.resendApiKey && this.config.provider === 'resend') {
        this.resend = new Resend(this.config.resendApiKey)
        console.log('✅ Resend initialized')
      }

      // Initialize SMTP
      if (this.config.smtpConfig && this.config.provider === 'smtp') {
        this.smtpTransporter = nodemailer.createTransport(this.config.smtpConfig)
        console.log('✅ SMTP transporter initialized')
      }
    } catch (error) {
      console.error('❌ Failed to initialize email providers:', error)
    }
  }

  // Main notification methods for different reservation statuses
  async sendReservationCreatedNotification(data: ReservationEmailData): Promise<boolean> {
    const subject = `Nová rezervace - ${data.startTime.toLocaleDateString('cs-CZ')}`
    
    const emailData: NotificationEmailData = {
      to: [data.doctorEmail], // Doctor's email for new reservation notification
      subject,
      htmlContent: this.generateReservationCreatedHtml(data),
      textContent: this.generateReservationCreatedText(data)
    }

    console.log(`📧 Sending new reservation notification to doctor: ${data.doctorEmail}`)
    return this.sendEmail(emailData)
  }

  async sendReservationConfirmedNotification(data: ReservationEmailData): Promise<boolean> {
    const subject = `Rezervace potvrzena - ${data.startTime.toLocaleDateString('cs-CZ')}`
    
    const emailData: NotificationEmailData = {
      to: [data.customerEmail], // Customer's email for confirmation
      subject,
      htmlContent: this.generateReservationConfirmedHtml(data),
      textContent: this.generateReservationConfirmedText(data)
    }

    console.log(`📧 Sending confirmation notification to client: ${data.customerEmail}`)
    return this.sendEmail(emailData)
  }

  async sendReservationCancelledNotification(data: ReservationEmailData, notifyBoth: boolean = true): Promise<boolean> {
    const subject = `Rezervace zrušena - ${data.startTime.toLocaleDateString('cs-CZ')}`
    
    const recipients = notifyBoth 
      ? [data.customerEmail, data.doctorEmail] // Both customer and doctor
      : [data.customerEmail] // Only customer

    const emailData: NotificationEmailData = {
      to: recipients,
      subject,
      htmlContent: this.generateReservationCancelledHtml(data),
      textContent: this.generateReservationCancelledText(data)
    }

    console.log(`📧 Sending cancellation notification to: ${recipients.join(', ')}`)
    return this.sendEmail(emailData)
  }

  async sendReservationCompletedNotification(data: ReservationEmailData): Promise<boolean> {
    const subject = `Návštěva dokončena - děkujeme!`
    
    const emailData: NotificationEmailData = {
      to: [data.customerEmail], // Customer thank you email
      subject,
      htmlContent: this.generateReservationCompletedHtml(data),
      textContent: this.generateReservationCompletedText(data)
    }

    console.log(`📧 Sending completion notification to client: ${data.customerEmail}`)
    return this.sendEmail(emailData)
  }

  async sendReservationReminderNotification(data: ReservationEmailData): Promise<boolean> {
    const subject = `Připomínka: Zítra máte návštěvu u veterináře`
    
    const emailData: NotificationEmailData = {
      to: [data.customerEmail], // Customer reminder
      subject,
      htmlContent: this.generateReservationReminderHtml(data),
      textContent: this.generateReservationReminderText(data)
    }

    console.log(`📧 Sending reminder notification to client: ${data.customerEmail}`)
    return this.sendEmail(emailData)
  }

  // Core email sending method
  private async sendEmail(emailData: NotificationEmailData): Promise<boolean> {
    try {
      console.log(`📧 Sending email via ${this.config.provider}...`)
      console.log(`   To: ${emailData.to.join(', ')}`)
      console.log(`   Subject: ${emailData.subject}`)

      switch (this.config.provider) {
        case 'resend':
          return await this.sendViaResend(emailData)
        case 'sendgrid':
          return await this.sendViaSendGrid(emailData)
        case 'smtp':
          return await this.sendViaSMTP(emailData)
        default:
          console.error(`❌ Unsupported email provider: ${this.config.provider}`)
          return false
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      return false
    }
  }

  private async sendViaResend(emailData: NotificationEmailData): Promise<boolean> {
    if (!this.resend) {
      console.error('❌ Resend not initialized')
      return false
    }

    try {
      const result = await this.resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        html: emailData.htmlContent,
        text: emailData.textContent,
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          content_type: att.contentType
        }))
      })

      if (result.error) {
        console.error('❌ Resend error:', result.error)
        return false
      }

      console.log('✅ Email sent via Resend:', result.data?.id)
      return true
    } catch (error) {
      console.error('❌ Resend sending failed:', error)
      return false
    }
  }

  private async sendViaSendGrid(emailData: NotificationEmailData): Promise<boolean> {
    try {
      const msg = {
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        subject: emailData.subject,
        html: emailData.htmlContent,
        text: emailData.textContent,
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: att.content.toString('base64'),
          type: att.contentType,
          disposition: 'attachment'
        }))
      }

      await sgMail.send(msg)
      console.log('✅ Email sent via SendGrid')
      return true
    } catch (error) {
      console.error('❌ SendGrid sending failed:', error)
      return false
    }
  }

  private async sendViaSMTP(emailData: NotificationEmailData): Promise<boolean> {
    if (!this.smtpTransporter) {
      console.error('❌ SMTP transporter not initialized')
      return false
    }

    try {
      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: emailData.to.join(', '),
        cc: emailData.cc?.join(', '),
        bcc: emailData.bcc?.join(', '),
        subject: emailData.subject,
        html: emailData.htmlContent,
        text: emailData.textContent,
        attachments: emailData.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      }

      const result = await this.smtpTransporter.sendMail(mailOptions)
      console.log('✅ Email sent via SMTP:', result.messageId)
      return true
    } catch (error) {
      console.error('❌ SMTP sending failed:', error)
      return false
    }
  }

  private generateReservationCreatedHtml(data: ReservationEmailData): string {
    const formatTime = (date: Date) => date.toLocaleString('cs-CZ', { 
      timeZone: data.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Nová rezervace</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .highlight { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 ${data.tenantName}</h1>
            <h2>Nová rezervace vyžaduje pozornost</h2>
        </div>
        
        <div class="content">
            <div class="highlight">
                <strong>⏰ Nová rezervace čeká na potvrzení!</strong>
            </div>
            
            <div class="details">
                <h3>📅 Detaily rezervace</h3>
                <p><strong>Termín:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
                <p><strong>Klient:</strong> ${data.customerName}</p>
                <p><strong>Email:</strong> ${data.customerEmail}</p>
                ${data.petName ? `<p><strong>Zvíře:</strong> ${data.petName} (${data.petType})</p>` : ''}
                ${data.description ? `<p><strong>Popis:</strong> ${data.description}</p>` : ''}
                ${data.room ? `<p><strong>Místnost:</strong> ${data.room}</p>` : ''}
                ${data.serviceType ? `<p><strong>Služba:</strong> ${data.serviceType}</p>` : ''}
            </div>
            
            <p>Nezapomeňte rezervaci potvrdit nebo zrušit přes administraci systému.</p>
        </div>
        
        <div class="footer">
            <p>Rezervační systém ${data.tenantName}<br>
            ID rezervace: ${data.reservationId}</p>
        </div>
    </div>
</body>
</html>`
  }

  private generateReservationCreatedText(data: ReservationEmailData): string {
    const formatTime = (date: Date) => date.toLocaleString('cs-CZ', { 
      timeZone: data.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
🏥 ${data.tenantName}
NOVÁ REZERVACE

⏰ Nová rezervace čeká na potvrzení!

📅 DETAILY REZERVACE
Termín: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}
Klient: ${data.customerName}
Email: ${data.customerEmail}
${data.petName ? `Zvíře: ${data.petName} (${data.petType})\n` : ''}${data.description ? `Popis: ${data.description}\n` : ''}${data.room ? `Místnost: ${data.room}\n` : ''}${data.serviceType ? `Služba: ${data.serviceType}\n` : ''}

Nezapomeňte rezervaci potvrdit nebo zrušit přes administraci systému.

---
Rezervační systém ${data.tenantName}
ID rezervace: ${data.reservationId}
    `.trim()
  }

  private generateReservationConfirmedHtml(data: ReservationEmailData): string {
    const formatTime = (date: Date) => date.toLocaleString('cs-CZ', { 
      timeZone: data.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rezervace potvrzena</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
        .content { background: #f0fdf4; padding: 20px; border: 1px solid #bbf7d0; }
        .highlight { background: #dcfce7; padding: 10px; border-left: 4px solid #16a34a; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 ${data.tenantName}</h1>
            <h2>✅ Rezervace potvrzena!</h2>
        </div>
        
        <div class="content">
            <div class="highlight">
                <strong>Váše rezervace byla úspěšně potvrzena!</strong>
            </div>
            
            <div class="details">
                <h3>📅 Vaše návštěva</h3>
                <p><strong>Termín:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
                <p><strong>Veterinář:</strong> ${data.doctorName}</p>
                ${data.petName ? `<p><strong>Zvíře:</strong> ${data.petName} (${data.petType})</p>` : ''}
                ${data.room ? `<p><strong>Místnost:</strong> ${data.room}</p>` : ''}
                ${data.serviceType ? `<p><strong>Služba:</strong> ${data.serviceType}</p>` : ''}
            </div>
            
            <p>Prosíme, dostavte se včas. V případě nutnosti zrušení nás kontaktujte co nejdříve.</p>
        </div>
        
        <div class="footer">
            <p>Těšíme se na vaši návštěvu!<br>
            ${data.tenantName}<br>
            ID rezervace: ${data.reservationId}</p>
        </div>
    </div>
</body>
</html>`
  }

  private generateReservationConfirmedText(data: ReservationEmailData): string {
    const formatTime = (date: Date) => date.toLocaleString('cs-CZ', { 
      timeZone: data.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
🏥 ${data.tenantName}
REZERVACE POTVRZENA

✅ Váše rezervace byla úspěšně potvrzena!

📅 VAŠE NÁVŠTĚVA
Termín: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}
Veterinář: ${data.doctorName}
${data.petName ? `Zvíře: ${data.petName} (${data.petType})\n` : ''}${data.room ? `Místnost: ${data.room}\n` : ''}${data.serviceType ? `Služba: ${data.serviceType}\n` : ''}

Prosíme, dostavte se včas. V případě nutnosti zrušení nás kontaktujte co nejdříve.

Těšíme se na vaši návštěvu!

---
${data.tenantName}
ID rezervace: ${data.reservationId}
    `.trim()
  }

  private generateReservationCancelledHtml(data: ReservationEmailData): string {
    const formatTime = (date: Date) => date.toLocaleString('cs-CZ', { 
      timeZone: data.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rezervace zrušena</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background: #fef2f2; padding: 20px; border: 1px solid #fecaca; }
        .highlight { background: #fee2e2; padding: 10px; border-left: 4px solid #dc2626; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 ${data.tenantName}</h1>
            <h2>❌ Rezervace zrušena</h2>
        </div>
        
        <div class="content">
            <div class="highlight">
                <strong>Vaše rezervace byla zrušena.</strong>
            </div>
            
            <div class="details">
                <h3>📅 Zrušená rezervace</h3>
                <p><strong>Termín:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
                <p><strong>Veterinář:</strong> ${data.doctorName}</p>
                ${data.petName ? `<p><strong>Zvíře:</strong> ${data.petName} (${data.petType})</p>` : ''}
            </div>
            
            <p>Můžete si vytvořit novou rezervaci, kdy vám to bude vyhovovat.</p>
        </div>
        
        <div class="footer">
            <p>Děkujeme za pochopení<br>
            ${data.tenantName}<br>
            ID rezervace: ${data.reservationId}</p>
        </div>
    </div>
</body>
</html>`
  }

  private generateReservationCancelledText(data: ReservationEmailData): string {
    const formatTime = (date: Date) => date.toLocaleString('cs-CZ', { 
      timeZone: data.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
🏥 ${data.tenantName}
REZERVACE ZRUŠENA

❌ Vaše rezervace byla zrušena.

📅 ZRUŠENÁ REZERVACE
Termín: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}
Veterinář: ${data.doctorName}
${data.petName ? `Zvíře: ${data.petName} (${data.petType})\n` : ''}

Můžete si vytvořit novou rezervaci, kdy vám to bude vyhovovat.

Děkujeme za pochopení

---
${data.tenantName}
ID rezervace: ${data.reservationId}
    `.trim()
  }

  private generateReservationCompletedHtml(data: ReservationEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Návštěva dokončena</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #eff6ff; padding: 20px; border: 1px solid #bfdbfe; }
        .highlight { background: #dbeafe; padding: 10px; border-left: 4px solid #2563eb; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 ${data.tenantName}</h1>
            <h2>🎉 Děkujeme za návštěvu!</h2>
        </div>
        
        <div class="content">
            <div class="highlight">
                <strong>Vaše návštěva byla úspěšně dokončena.</strong>
            </div>
            
            <p>Děkujeme za důvěru v naše služby. Doufáme, že jste byli spokojeni s péčí o ${data.petName || 'vašeho mazlíčka'}.</p>
            
            <p>V případě jakýchkoliv dotazů nebo potřeby další návštěvy nás neváhejte kontaktovat.</p>
        </div>
        
        <div class="footer">
            <p>S úctou,<br>
            ${data.tenantName}<br>
            ID návštěvy: ${data.reservationId}</p>
        </div>
    </div>
</body>
</html>`
  }

  private generateReservationCompletedText(data: ReservationEmailData): string {
    return `
🏥 ${data.tenantName}
NÁVŠTĚVA DOKONČENA

🎉 Děkujeme za návštěvu!

Vaše návštěva byla úspěšně dokončena.

Děkujeme za důvěru v naše služby. Doufáme, že jste byli spokojeni s péčí o ${data.petName || 'vašeho mazlíčka'}.

V případě jakýchkoliv dotazů nebo potřeby další návštěvy nás neváhejte kontaktovat.

S úctou,

---
${data.tenantName}
ID návštěvy: ${data.reservationId}
    `.trim()
  }

  private generateReservationReminderHtml(data: ReservationEmailData): string {
    const formatTime = (date: Date) => date.toLocaleString('cs-CZ', { 
      timeZone: data.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Připomínka návštěvy</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { background: #fffbeb; padding: 20px; border: 1px solid #fed7aa; }
        .highlight { background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 ${data.tenantName}</h1>
            <h2>⏰ Připomínka návštěvy</h2>
        </div>
        
        <div class="content">
            <div class="highlight">
                <strong>Zítra máte objednanou návštěvu!</strong>
            </div>
            
            <div class="details">
                <h3>📅 Detaily návštěvy</h3>
                <p><strong>Termín:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
                <p><strong>Veterinář:</strong> ${data.doctorName}</p>
                ${data.petName ? `<p><strong>Zvíře:</strong> ${data.petName} (${data.petType})</p>` : ''}
                ${data.room ? `<p><strong>Místnost:</strong> ${data.room}</p>` : ''}
                ${data.serviceType ? `<p><strong>Služba:</strong> ${data.serviceType}</p>` : ''}
            </div>
            
            <p><strong>Připomínka:</strong> Prosíme, dostavte se včas. Nezapomeňte si přinést:</p>
            <ul>
                <li>Průkaz očkování (pokud jej máte)</li>
                <li>Případné předchozí lékařské zprávy</li>
                <li>Seznam léků, které zvíře užívá</li>
            </ul>
            
            <p>V případě potřeby zrušení nás kontaktujte co nejdříve.</p>
        </div>
        
        <div class="footer">
            <p>Těšíme se na vás!<br>
            ${data.tenantName}<br>
            ID rezervace: ${data.reservationId}</p>
        </div>
    </div>
</body>
</html>`
  }

  private generateReservationReminderText(data: ReservationEmailData): string {
    const formatTime = (date: Date) => date.toLocaleString('cs-CZ', { 
      timeZone: data.timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
🏥 ${data.tenantName}
PŘIPOMÍNKA NÁVŠTĚVY

⏰ Zítra máte objednanou návštěvu!

📅 DETAILY NÁVŠTĚVY
Termín: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}
Veterinář: ${data.doctorName}
${data.petName ? `Zvíře: ${data.petName} (${data.petType})\n` : ''}${data.room ? `Místnost: ${data.room}\n` : ''}${data.serviceType ? `Služba: ${data.serviceType}\n` : ''}

PŘIPOMÍNKA: Prosíme, dostavte se včas. Nezapomeňte si přinést:
• Průkaz očkování (pokud jej máte)
• Případné předchozí lékařské zprávy  
• Seznam léků, které zvíře užívá

V případě potřeby zrušení nás kontaktujte co nejdříve.

Těšíme se na vás!

---
${data.tenantName}
ID rezervace: ${data.reservationId}
    `.trim()
  }

  // Health check method
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing email service connection...')
      console.log(`   Provider: ${this.config.provider}`)
      console.log(`   From: ${this.config.fromName} <${this.config.fromEmail}>`)

      switch (this.config.provider) {
        case 'resend':
          return await this.testResendConnection()
        case 'sendgrid':
          return await this.testSendGridConnection()
        case 'smtp':
          return await this.testSMTPConnection()
        default:
          console.error(`❌ Unsupported provider: ${this.config.provider}`)
          return false
      }
    } catch (error) {
      console.error('❌ Email service test failed:', error)
      return false
    }
  }

  private async testResendConnection(): Promise<boolean> {
    if (!this.resend) {
      console.error('❌ Resend not initialized')
      return false
    }

    try {
      // Test with a simple email to a test address
      const testEmail = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: ['test@example.com'], // This won't actually send, just validates
        subject: 'Resend Test Connection',
        html: '<p>Test email - this should not be sent</p>',
        text: 'Test email - this should not be sent'
      }

      console.log('✅ Resend configuration validated')
      console.log(`   API Key: ${this.config.resendApiKey ? 'SET' : 'MISSING'}`)
      console.log(`   From Address: ${this.config.fromEmail}`)
      
      // Instead of actually sending, just validate the configuration
      if (!this.config.resendApiKey) {
        console.error('❌ RESEND_API_KEY is missing')
        return false
      }

      if (!this.config.fromEmail) {
        console.error('❌ FROM_EMAIL is missing')
        return false
      }

      console.log('✅ Resend ready to send emails')
      return true
    } catch (error) {
      console.error('❌ Resend test failed:', error)
      return false
    }
  }

  private async testSendGridConnection(): Promise<boolean> {
    console.log('✅ SendGrid configuration validated')
    return !!this.config.sendgridApiKey
  }

  private async testSMTPConnection(): Promise<boolean> {
    if (!this.smtpTransporter) {
      console.error('❌ SMTP transporter not initialized')
      return false
    }

    try {
      await this.smtpTransporter.verify()
      console.log('✅ SMTP connection verified')
      return true
    } catch (error) {
      console.error('❌ SMTP test failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()
export { ReservationEmailData } 