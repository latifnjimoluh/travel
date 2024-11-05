import { execSync } from 'child_process';
import nodemailer from 'nodemailer';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import PDFDocument from 'pdfkit';
import fs from 'fs';

// Initialiser l'API Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Récupérer les détails du dernier commit
function getCommitDetails() {
    const commitInfo = execSync('git log -1 --pretty=format:"%H - %an <%ae> - %s"').toString();
    const commitDetails = execSync('git log -1 --pretty=format:"Commit par : %an\nEmail : %ae\nMessage : %s\nDate : %ad"').toString();
    return { commitInfo, commitDetails };
}

// Récupérer les modifications du dernier commit
function getDiff() {
    return execSync('git diff HEAD~1 HEAD').toString();
}

// Récupérer les fichiers modifiés du dernier commit
function getModifiedFiles() {
    return execSync('git diff --name-only HEAD~1 HEAD').toString().trim().split('\n');
}

// Analyser le code via Gemini
async function analyzeCodeWithGemini(code) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Veuillez examiner le code suivant puis fournir le nom des fichiers modifiés, la modification effectuée et suggérer des améliorations. Répond uniquement en français:\n\n${code}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text() || "Aucune suggestion d'amélioration disponible.";
}

// Créer un PDF avec les suggestions
function createPDF(commitDetails, suggestions, outputPath) {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(outputPath));

    doc.fontSize(16).text('Détails du Commit', { underline: true });
    doc.moveDown().fontSize(12).text(commitDetails);

    doc.moveDown().fontSize(16).text("Suggestions d'Amélioration", { underline: true });
    doc.moveDown().fontSize(12).text(suggestions);

    doc.end();
}

// Envoi d'un email avec les détails et suggestions d'amélioration
function sendEmail(userEmail, commitDetails, modifiedFiles, pdfPath) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Notification Git" <${process.env.SMTP_USERNAME}>`,
        to: userEmail,
        subject: "Nouveau commit effectué",
        html: `
            <html>
            <head><title>Notification de Commit</title></head>
            <body style="font-family: Arial, sans-serif;">
                <div style="background-color: #f9f9f9; padding: 20px;">
                    <h1>Nouveau Commit Effectué !</h1>
                    <p>Voici les détails du dernier commit :</p>
                    <pre>${commitDetails}</pre>
                    <p><strong>Fichiers modifiés :</strong></p>
                    <ul>${modifiedFiles.map(file => `<li>${file}</li>`).join('')}</ul>
                    <p>Veuillez trouver en pièce jointe les suggestions d'amélioration.</p>
                </div>
            </body>
            </html>
        `,
        attachments: [{ filename: 'suggestions_gemini.pdf', path: pdfPath }],
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Erreur lors de l'envoi de l'email : ${error.message}`);
        } else {
            console.log(`Notification de commit envoyée à ${userEmail} !`);
            fs.unlinkSync(pdfPath); // Supprimer le PDF après l'envoi
        }
    });
}

// Fonction principale pour exécuter le script
async function main() {
    const { commitInfo, commitDetails } = getCommitDetails();
    const diff = getDiff();
    const modifiedFiles = getModifiedFiles();

    console.log('Informations du dernier commit:', commitInfo);
    console.log('Détails du commit:', commitDetails);
    console.log('Différences du dernier commit:', diff);
    console.log('Fichiers modifiés :', modifiedFiles.join(', '));

    if (!diff.trim()) {
        console.log('Aucune modification de code à analyser.');
        return;
    }

    const geminiSuggestions = await analyzeCodeWithGemini(diff);

    // Créer le fichier PDF
    const pdfPath = 'suggestions_gemini.pdf';
    createPDF(commitDetails, geminiSuggestions, pdfPath);

    const userEmail = (commitInfo.match(/<(.*?)>/) || [])[1] || '';
    if (userEmail) {
        sendEmail(userEmail, commitDetails, modifiedFiles, pdfPath);
    }
}

main();
