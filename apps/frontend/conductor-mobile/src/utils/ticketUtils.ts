import RNFS from 'react-native-fs';
import { convert as convertToPDF } from 'react-native-html-to-pdf';

export interface TicketDetails {
  ticketId: string;
  name?: string;
  start: string;
  end: string;
  seatNumber?: string;
  passengerCount: number;
  ticketFee: string;
  paymentStatus: string;
  issuedOn: string;
  phoneNumber?: string;
}

export const generateQRCodeData = (ticketData: TicketDetails): string => {
  // Create a JSON string with all ticket details for QR code
  const qrData = {
    id: ticketData.ticketId,
    from: ticketData.start,
    to: ticketData.end,
    passengers: ticketData.passengerCount,
    fare: ticketData.ticketFee,
    issued: ticketData.issuedOn,
    seat: ticketData.seatNumber || 'N/A',
    payment: ticketData.paymentStatus,
    phone: ticketData.phoneNumber || 'N/A'
  };
  
  return JSON.stringify(qrData);
};

export const generateTicketPDF = async (ticketData: TicketDetails, qrCodeDataURL: string): Promise<string> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .ticket {
                background: white;
                border-radius: 12px;
                padding: 30px;
                margin: 0 auto;
                max-width: 400px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                border: 2px dashed #0066FF;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #0066FF;
                padding-bottom: 20px;
                margin-bottom: 20px;
            }
            .title {
                color: #0066FF;
                font-size: 24px;
                font-weight: bold;
                margin: 0;
            }
            .subtitle {
                color: #666;
                font-size: 14px;
                margin: 5px 0 0 0;
            }
            .qr-section {
                text-align: center;
                margin: 20px 0;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 8px;
            }
            .qr-code {
                width: 120px;
                height: 120px;
                margin: 0 auto;
                display: block;
            }
            .details {
                margin-top: 20px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding: 8px 0;
                border-bottom: 1px dotted #ddd;
            }
            .detail-label {
                font-weight: bold;
                color: #333;
                flex: 1;
            }
            .detail-value {
                color: #666;
                text-align: right;
                flex: 1;
            }
            .route-info {
                background-color: #0066FF;
                color: white;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
            }
            .route-text {
                font-size: 18px;
                font-weight: bold;
                margin: 0;
            }
            .fare-text {
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0 0 0;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                color: #999;
                font-size: 12px;
            }
            .important {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 4px;
                padding: 10px;
                margin: 15px 0;
                font-size: 12px;
                color: #856404;
            }
        </style>
    </head>
    <body>
        <div class="ticket">
            <div class="header">
                <h1 class="title">Bus Ticket</h1>
                <p class="subtitle">Conductor Mobile App</p>
            </div>
            
            <div class="route-info">
                <p class="route-text">${ticketData.start} → ${ticketData.end}</p>
                <p class="fare-text">${ticketData.ticketFee}</p>
            </div>
            
            <div class="qr-section">
                <img src="${qrCodeDataURL}" class="qr-code" alt="QR Code" />
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Scan for verification</p>
            </div>
            
            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Ticket ID:</span>
                    <span class="detail-value">${ticketData.ticketId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Passenger Name:</span>
                    <span class="detail-value">${ticketData.name || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Start Station:</span>
                    <span class="detail-value">${ticketData.start}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">End Station:</span>
                    <span class="detail-value">${ticketData.end}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Seat Number(s):</span>
                    <span class="detail-value">${ticketData.seatNumber || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">No. of Passengers:</span>
                    <span class="detail-value">${ticketData.passengerCount}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Ticket Fee:</span>
                    <span class="detail-value">${ticketData.ticketFee}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Status:</span>
                    <span class="detail-value">${ticketData.paymentStatus}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Issued On:</span>
                    <span class="detail-value">${ticketData.issuedOn}</span>
                </div>
                ${ticketData.phoneNumber ? `
                <div class="detail-row">
                    <span class="detail-label">Phone Number:</span>
                    <span class="detail-value">${ticketData.phoneNumber}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="important">
                <strong>Important:</strong> Please keep this ticket with you during the journey. Show QR code to conductor when requested.
            </div>
            
            <div class="footer">
                <p>Thank you for choosing our service!</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
  `;

  try {
    const options = {
      html,
      fileName: `ticket_${ticketData.ticketId}`,
      directory: 'Documents',
      base64: false,
    };

    const pdf = await convertToPDF(options);
    return pdf.filePath || '';
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const shareTicketPDF = async (filePath: string): Promise<void> => {
  try {
    // Check if file exists
    const fileExists = await RNFS.exists(filePath);
    if (!fileExists) {
      throw new Error('PDF file not found');
    }

    // You can implement sharing logic here
    // For now, we'll just log the file path
    console.log('PDF generated at:', filePath);
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};
