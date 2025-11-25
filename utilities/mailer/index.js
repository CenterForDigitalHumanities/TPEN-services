import nodemailer from "nodemailer"
import fs from "fs"
import path from "path"
import {fileURLToPath} from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const sendMail = async (email, subject, message) => {
  if (!email || typeof email !== "string") {
    return {
      status: 400,
      message:
        "Invalid receiver. An object with a valid email property is required."
    }
  }

  if (!subject || typeof subject !== "string") {
    return {
      status: 400,
      message: "Subject is required and must be a string."
    }
  }

  if (!message || typeof message !== "string") {
    return {
      status: 400,
      message: "Message body is required and must be a string."
    }
  }

  const templatepath = path.join(__dirname, "template.html")
  let htmlTemplate = fs.readFileSync(templatepath, "utf-8")

  htmlTemplate = htmlTemplate.replace("{{userName}}", "TPEN User")
  htmlTemplate = htmlTemplate.replace("{{subject}}", subject)
  htmlTemplate = htmlTemplate.replace("{{messageBody}}", message)

  // Stop execution if any of the required environment variables are not set
  const requiredEnvVars = [
    "SMTP_HOST",
    "SMTP_PORT",
    "TPEN_SUPPORT_EMAIL",
    "TPEN_EMAIL_CC"
  ]

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      return {
        status: 500,
        message: `${varName} environment variable is not set.`
      }
    }
  }

   try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
    })

    // Verify SMTP connection before attempting to send
    try {
      await transporter.verify()
      console.log("Server is ready to take our messages")
    } catch (error) {
      console.error("Error in SMTP configuration: ", error)
      return {status: 500, message: `SMTP connection failed: ${error.message}`}
    }

    const mailOptions = {
      from: process.env.TPEN_SUPPORT_EMAIL,
      to: email,
      cc: process.env.TPEN_EMAIL_CC,
      subject,
      html: htmlTemplate
    }

    const info = await transporter.sendMail(mailOptions)
    return {status: 200, message: info.response}
  } catch (error) {
    return {status: error.status ?? 500, message: error.toString()}
  }
}
