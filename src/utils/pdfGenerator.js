const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF ticket for a movie
 * @param {Object} ticketData - Ticket information
 * @param {string} ticketData.bookingId - Booking ID
 * @param {string} ticketData.movieTitle - Movie title
 * @param {string} ticketData.showTime - Show time
 * @param {string} ticketData.seats - Seat numbers
 * @param {string} ticketData.studioName - Studio name
 * @param {number} ticketData.totalAmount - Total amount
 * @param {string} [ticketData.qrCode] - QR code data URL
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateTicketPDF = async (ticketData) => {
    return new Promise((resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument({
                size: [400, 200], // Landscape orientation
                margin: 0,
                info: {
                    Title: `Movie Ticket - ${ticketData.movieTitle}`,
                    Author: 'Cinemium',
                    Subject: 'Movie Ticket'
                }
            });

            // Collect PDF chunks
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));

            // Add white background
            doc.rect(0, 0, doc.page.width, doc.page.height)
               .fill('#ffffff');

            // Add ticket border
            doc.rect(5, 5, doc.page.width - 10, doc.page.height - 10)
               .lineWidth(1)
               .stroke('#000000');

            // Add vertical perforated line
            doc.save()
               .moveTo(130, 5)
               .lineTo(130, doc.page.height - 5)
               .dash(5, { space: 5 })
               .stroke()
               .undash();

            // Header
            doc.font('Helvetica-Bold')
               .fontSize(10)
               .fillColor('#000000')
               .text('MOVIE TICKET', 20, 20);

            // Left section
            doc.font('Helvetica')
               .fontSize(8)
               .text(`Ticket No: ${ticketData.bookingId}`, 20, 40)
               .text(`Seat: ${ticketData.seats}`, 20, 60)
               .text(`Studio: ${ticketData.studioName}`, 20, 80)
               .text(`Date: ${new Date(ticketData.showTime).toLocaleDateString()}`, 20, 100)
               .text(`Time: ${new Date(ticketData.showTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 20, 120);

            // Add barcode/QR code
            if (ticketData.qrCode) {
                doc.image(ticketData.qrCode, 20, 140, {
                    width: 50,
                    height: 50
                });
            }

            // Right section
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .text('ADMIT ONE', 150, 20)
               .font('Helvetica')
               .fontSize(10)
               .text(ticketData.movieTitle, 150, 50, { width: 230 })
               .fontSize(8)
               .text(`Seat: ${ticketData.seats}`, 150, 80)
               .text(`Studio: ${ticketData.studioName}`, 150, 100)
               .text(`Date: ${new Date(ticketData.showTime).toLocaleDateString()}`, 150, 120)
               .text(`Time: ${new Date(ticketData.showTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 150, 140)
               .text(`Price: Rp${ticketData.totalAmount.toLocaleString()}`, 150, 160);

            // Finalize PDF
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateTicketPDF
}; 