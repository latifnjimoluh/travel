import { execSync } from 'child_process';
import nodemailer from 'nodemailer';
import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";
import PDFDocument from 'pdfkit';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getCommitDetails() {
    try {
        const commitInfo = execSync('git log -1 --pretty=format:"%H - %an <%ae> - %s"').toString();
        const commitDetails = execSync('git log -1 --pretty=format:"Commit par : %an\nEmail : %ae\nMessage : %s\nDate : %ad"').toString();
        return { commitInfo, commitDetails };
    } catch (error) {
        console.error('Erreur lors de la récupération des détails du commit:', error);
        return {};
    }
}

function getDiff() {
    try {
        return execSync('git diff HEAD~1 HEAD').toString();
    } catch (error) {
        console.error('Erreur lors de la récupération des différences de code:', error);
        return '';
    }
}

function getModifiedFiles() {
    try {
        return execSync('git diff --name-only HEAD~1 HEAD').toString().trim().split('\n');
    } catch (error) {
        console.error('Erreur lors de la récupération des fichiers modifiés:', error);
        return [];
    }
}

async function analyzeCodeWithGemini(code) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Veuillez examiner le code suivant puis fournir le nom des fichiers modifiés, la modification effectuée et suggérer des améliorations. Répond uniquement en français:\n\n${code}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result?.response?.text() || 'Aucune suggestion d\'amélioration disponible.';
        return text;
    } catch (error) {
        console.error("Erreur d'analyse avec Gemini:", error);
        return 'Erreur d\'analyse avec Gemini.';
    }
}

function createPDF(commitDetails, suggestions, outputPath) {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(outputPath));
    doc.fontSize(16).text('Détails du Commit', { underline: true });
    doc.moveDown().fontSize(12).text(commitDetails);
    doc.moveDown().fontSize(16).text('Suggestions d\'Amélioration', { underline: true });
    doc.moveDown().fontSize(12).text(suggestions);
    doc.end();
}

async function main() {
    const { commitInfo, commitDetails } = getCommitDetails();
    const diff = getDiff();
    const modifiedFiles = getModifiedFiles();

    if (!commitInfo || !diff.trim()) {
        console.log('Aucune modification de code à analyser.');
        return;
    }

    const geminiSuggestions = await analyzeCodeWithGemini(diff);
    const pdfPath = 'suggestions_gemini.pdf';
    createPDF(commitDetails, geminiSuggestions, pdfPath);

    let userEmail = (commitInfo.match(/<(.*?)>/) || [])[1] || '';
    if (!userEmail.includes('@gmail.com')) {
        const username = userEmail.split('+')[1] || '';
        userEmail = `${username}@gmail.com`;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USERNAME, pass: process.env.SMTP_PASSWORD },
    });

    const mailOptions = {
        from: `"Notification Git" <${process.env.SMTP_USERNAME}>`,
        to: userEmail,
        subject: "Nouveau commit effectué",
        html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="background-color: #ffffff; padding: 20px; border-radius: 5px;">
                    <h1 style="color: #333;">Nouveau Commit Effectué !</h1>
                    <p>Voici les détails du dernier commit :</p>
                    <pre>${commitDetails}</pre>
                    <p><strong>Fichiers modifiés :</strong></p>
                    <ul>${modifiedFiles.map(file => `<li>${file}</li>`).join('')}</ul>
                    <p>Veuillez trouver en pièce jointe les suggestions d'amélioration.</p>
                </div>
            </div>
        `,
        attachments: [{ filename: 'suggestions_gemini.pdf', path: pdfPath }],
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Erreur lors de l'envoi de l'email : ${error.message}`);
        } else {
            console.log(`Notification de commit envoyée à ${userEmail} !`);
            fs.unlinkSync(pdfPath);
        }
    });
}

main();
