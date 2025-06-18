const PDFDocument = require('pdfkit');
const { Transaction, Movie, Showtime, Studio, Seat, AddOn } = require('../models');

exports.generateTicketPDF = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        {
          model: Showtime,
          include: [
            { model: Movie },
            { model: Studio }
          ]
        },
        { model: Seat },
        { model: AddOn }
      ]
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A6',
      margin: 20
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${transaction.id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('Cinemium Ticket', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Movie: ${transaction.Showtime.Movie.title}`);
    doc.text(`Date: ${new Date(transaction.Showtime.startTime).toLocaleDateString()}`);
    doc.text(`Time: ${new Date(transaction.Showtime.startTime).toLocaleTimeString()}`);
    doc.text(`Studio: ${transaction.Showtime.Studio.name}`);
    doc.text(`Seats: ${transaction.Seats.map(seat => seat.seatNumber).join(', ')}`);
    
    if (transaction.AddOns && transaction.AddOns.length > 0) {
      doc.moveDown();
      doc.text('Add-ons:');
      transaction.AddOns.forEach(addon => {
        doc.text(`- ${addon.name} (${addon.TransactionAddOn.quantity}x)`);
      });
    }

    doc.moveDown();
    doc.text(`Total Amount: $${transaction.totalAmount.toFixed(2)}`);
    doc.text(`Transaction ID: ${transaction.id}`);
    
    // Add QR code or barcode here if needed
    
    // Finalize PDF
    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 