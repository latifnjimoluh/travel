import { execSync } from 'child_process';
import nodemailer from 'nodemailer';
import { PDFDocument, rgb } from 'pdf-lib'; // Importer PDFDocument
import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialiser le client Gemini avec la clé API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Récupérer les informations du dernier commit
const commitInfo = execSync('git log -1 --pretty=format:"%H - %an <%ae> - %s"').toString();
const commitDetails = execSync('git log -1 --pretty=format:"Commit par : %an<br>Email : %ae<br>Message : %s<br>Date : %ad"').toString();

// Afficher les informations du commit pour le débogage
console.log('Informations du dernier commit:', commitInfo);
console.log('Détails du commit:', commitDetails);

// Extraire l'adresse e-mail de l'auteur du commit
const emailMatch = commitInfo.match(/<(.*?)>/);
let userEmail = emailMatch ? emailMatch[1] : '';

// Vérifier si l'adresse e-mail est déjà au bon format
if (!userEmail.includes('@gmail.com')) {
    const username = userEmail.substring(userEmail.indexOf('+') + 1, userEmail.indexOf('@'));
    userEmail = `${username}@gmail.com`; // Créer l'adresse e-mail
}

// Afficher l'adresse email pour le débogage
console.log('Adresse e-mail de l\'auteur du commit:', userEmail);

// Récupérer les modifications du dernier commit
const diff = execSync('git diff HEAD~1 HEAD').toString();

// Afficher les différences pour le débogage
console.log('Différences du dernier commit:', diff);

// Fonction d'analyse de code pour vérifier les critères
function analyzeCodeForCriteria(code) {
    const issues = [];

    // Vérification du camel case
    const variableFunctionNames = code.match(/\b(?:var|let|const|function)\s+([a-z][a-zA-Z0-9]*)/g);
    if (variableFunctionNames) {
        variableFunctionNames.forEach((name) => {
            const match = name.match(/\s+([a-z][a-zA-Z0-9]*)/);
            if (match && match[1] !== match[1].replace(/^[a-z]+|[A-Z]/g, (letter, index) => (index === 0 ? letter.toLowerCase() : letter.toUpperCase()))) {
                issues.push(`Nom de variable ou fonction "${match[1]}" ne respecte pas le style camel case.`);
            }
        });
    }

    // Vérification de la lisibilité et de la modularité
    if (code.length > 200) {
        issues.push('Le code est trop long et pourrait bénéficier d\'une meilleure modularité.');
    }

    // Retourner les problèmes trouvés
    return issues.length > 0 ? issues.join('<br>') : 'Le code respecte les critères de style.';
}

// Fonction pour analyser le code via Gemini
async function analyzeCodeWithGemini(code) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Initialiser le modèle
        const result = await model.generateContent(`Please review the following code and suggest improvements:\n\n${code}`);
        const text = await result.response.text(); // Extraire le texte de la réponse
        return text || 'Aucune suggestion d\'amélioration disponible.'; // Vérifier si le texte est vide
    } catch (error) {
        console.error(`Erreur lors de l'analyse du code : ${error.message}`);
        return 'Aucune suggestion d\'amélioration disponible.';
    }
}

// Fonction pour créer un PDF avec les suggestions

async function createPdf(combinedSuggestions) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const { width, height } = page.getSize();
    const fontSize = 12;
    
    // Texte de titre
    page.drawText('Suggestions d\'amélioration', {
        x: 50,
        y: height - 50,
        size: 20,
        color: rgb(0, 0, 0),
    });

    // Contenu des suggestions d'amélioration (décompose les lignes longues)
    const textLines = splitTextIntoLines(combinedSuggestions, 80); // 80 caractères par ligne environ
    let yPosition = height - 100;

    textLines.forEach(line => {
        if (yPosition < 50) {
            // Ajouter une nouvelle page si on atteint le bas de la page
            page = pdfDoc.addPage([600, 400]);
            yPosition = height - 50;
        }
        page.drawText(line, {
            x: 50,
            y: yPosition,
            size: fontSize,
            color: rgb(0, 0, 0),
        });
        yPosition -= fontSize + 4; // Ajuster l'espacement entre les lignes
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

// Fonction utilitaire pour diviser le texte en lignes de longueur définie
function splitTextIntoLines(text, maxCharsPerLine) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length > maxCharsPerLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine += `${word} `;
        }
    });
    lines.push(currentLine.trim()); // Ajouter la dernière ligne
    return lines;
}


// Configuration du transporteur de courrier avec nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true pour SSL, false pour TLS
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
});

// Fonction principale pour exécuter le script
async function main() {
    // Analyse du code pour vérifier les critères
    const localSuggestions = analyzeCodeForCriteria(diff);
    console.log('Suggestions d\'amélioration locales:', localSuggestions);

    // Analyse du code et obtention des suggestions via Gemini
    const geminiSuggestions = await analyzeCodeWithGemini(diff);

    // Combiner les suggestions locales et celles de Gemini
    const combinedSuggestions = `
        <strong>Suggestions d'amélioration locales :</strong><br>
        <pre>${localSuggestions}</pre>
        <strong>Suggestions d'amélioration via Gemini :</strong><br>
        <pre>${geminiSuggestions}</pre>
    `;

    // Afficher les suggestions combinées pour le débogage
    console.log('Suggestions d\'amélioration combinées:', combinedSuggestions);

    // Créer le PDF
    const pdfBytes = await createPdf(combinedSuggestions);

    // Options de l'email
    const mailOptions = {
        from: `"Notification Git" <${process.env.SMTP_USERNAME}>`,
        to: userEmail,
        subject: "Nouveau commit effectué",
        html: `
            <html>
            <head>
                <title>Notification de Commit</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        background-color: #ffffff;
                        border-radius: 5px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        padding: 20px;
                    }
                    h1 {
                        color: #333;
                    }
                    pre {
                        background-color: #eee;
                        border-left: 3px solid #007bff;
                        padding: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Nouveau Commit Effectué !</h1>
                    <p>Voici les détails du dernier commit :</p>
                    <pre>${commitDetails}</pre>
                    <p>Merci de votre attention. Les suggestions détaillées sont incluses dans le document PDF ci-joint.</p>
                </div>
            </body>
            </html>
        `,
        attachments: [
            {
                filename: 'suggestions.pdf',
                content: pdfBytes,
                contentType: 'application/pdf',
            },
        ],
    };

    // Envoyer l'email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Erreur lors de l'envoi de l'email : ${error.message}`);
        } else {
            console.log(`Notification de commit envoyée à ${userEmail} avec le PDF joint !`);
        }
    });
}

// Exécuter le script principal
main();
