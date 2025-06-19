const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF ticket for a movie
 * @param {Object} ticketData - Ticket information
 * @param {string} ticketData.movieTitle - Movie title
 * @param {string} ticketData.showTime - Show time
 * @param {string} ticketData.seatNumber - Seat number
 * @param {string} ticketData.studio - Studio number
 * @param {string} ticketData.qrCode - QR code data URL
 * @returns {Promise<string>} - Path to the generated PDF
 */
const generateTicketPDF = async (ticketData) => {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument({
                size: 'A6',
                layout: 'landscape',
                margin: 20
            });

            // Create unique filename
            const filename = `ticket_${Date.now()}.pdf`;
            const filepath = path.join(__dirname, '../../temp', filename);

            // Ensure temp directory exists
            if (!fs.existsSync(path.join(__dirname, '../../temp'))) {
                fs.mkdirSync(path.join(__dirname, '../../temp'), { recursive: true });
            }

            // Pipe PDF to file
            const stream = fs.createWriteStream(filepath);
            doc.pipe(stream);

            // Add content
            doc
                .fontSize(24)
                .font('Helvetica-Bold')
                .text('CINEMIUM', { align: 'center' })
                .moveDown();

            doc
                .fontSize(16)
                .font('Helvetica')
                .text('Movie Ticket', { align: 'center' })
                .moveDown();

            // Add movie details
            doc
                .fontSize(12)
                .text(`Movie: ${ticketData.movieTitle}`)
                .text(`Show Time: ${new Date(ticketData.showTime).toLocaleString()}`)
                .text(`Seat: ${ticketData.seatNumber}`)
                .text(`Studio: ${ticketData.studio}`)
                .moveDown();

            // Add QR code
            if (ticketData.qrCode) {
                doc.image(ticketData.qrCode, {
                    fit: [150, 150],
                    align: 'center'
                });
            }

            // Add footer
            doc
                .fontSize(8)
                .text('Thank you for choosing Cinemium!', { align: 'center' })
                .text('Please arrive 15 minutes before the show.', { align: 'center' });

            // Finalize PDF
            doc.end();

            // Handle stream completion
            stream.on('finish', () => {
                resolve(filepath);
            });

            stream.on('error', (error) => {
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateTicketPDF
}; 