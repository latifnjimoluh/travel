import { execSync } from 'child_process';
import nodemailer from 'nodemailer';
import 'dotenv/config';
import axios from 'axios';

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

// Fonction pour analyser le code via Gemini
// Fonction pour analyser le code via Gemini
async function analyzeCode(code) {
    try {
        const requestPayload = {
            contents: [
                {
                    parts: [
                        {
                            text: `Please review the following code and suggest improvements:\n\n${code}`
                        }
                    ]
                }
            ],
        };

        console.log('Détails de la requête à l\'API Gemini:', requestPayload);

        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY,
            requestPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('Réponse de l\'API reçue:', response.data); // Log la réponse

        // Inspecter le contenu du candidat
        if (response.data.candidates && response.data.candidates.length > 0) {
            const candidateContent = response.data.candidates[0].content;
            console.log('Contenu du candidat:', candidateContent); // Log pour voir la structure

            // Si content est un tableau d'objets, parcourez-le pour trouver le texte
            if (Array.isArray(candidateContent) && candidateContent.length > 0) {
                return candidateContent.map(part => part.text).join('\n'); // Rejoindre les textes si plusieurs parties
            } else {
                return 'Aucune suggestion d\'amélioration disponible.';
            }
        } else {
            return 'Aucune suggestion d\'amélioration disponible.';
        }
    } catch (error) {
        console.error(`Erreur lors de l'analyse du code : ${error.message}`);
        return 'Aucune suggestion d\'amélioration disponible.';
    }
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
    // Analyse du code et obtention des suggestions
    const suggestions = await analyzeCode(diff);

    // Afficher les suggestions pour le débogage
    console.log('Suggestions d\'amélioration reçues:', suggestions);

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
                    <h1>🎉 Nouveau Commit Effectué !</h1>
                    <p>Voici les détails du dernier commit :</p>
                    <pre>${commitDetails}</pre>
                    <p>Suggestions d'amélioration :</p>
                    <pre>${suggestions}</pre>
                    <p>Merci de votre attention.</p>
                </div>
            </body>
            </html>
        `,
    };

    // Envoyer l'email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Erreur lors de l'envoi de l'email : ${error.message}`);
        } else {
            console.log(`Notification de commit envoyée à ${userEmail} !`);
        }
    });
}

// Exécuter le script principal
main();
