import { Component } from '@angular/core';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-inv-template',
  imports: [],
  templateUrl: './inv-template.html',
  styleUrl: './inv-template.scss'
})
export class InvTemplate {

  previewPDF() {
    const docDefinition: any = this.getInvoiceDocDefinition();
    pdfMake.createPdf(docDefinition).open();
  }

  downloadPDF() {
    const docDefinition: any = this.getInvoiceDocDefinition();
    pdfMake.createPdf(docDefinition).download('invoice.pdf');
  }

  getInvoiceDocDefinition() {
    // Details for left and right columns
    const leftDetails = [
      [{ text: 'Vendor', bold: true }, ':', 'CASH SALES - JOHNSON ACCOUNT'],
      [{ text: 'Address', bold: true }, ':', ''],
      [{ text: 'Tel No', bold: true }, ':', ''],
      [{ text: 'Fax No', bold: true }, ':', ''],
      [{ text: 'TRN', bold: true }, ':', '']
    ];
    const rightDetails = [
      [{ text: 'Doc No', bold: true }, ':', 'INV-202404937'],
      [{ text: 'Doc Date', bold: true }, ':', '25/09/2024'],
      [{ text: 'Customer Code', bold: true }, ':', '540.Z128'],
      [{ text: 'LPO No', bold: true }, ':', ''],
      [{ text: 'Payment Terms', bold: true }, ':', 'CASH'],
      [{ text: 'Branch', bold: true }, ':', 'Head Office'],
      [{ text: 'Salesman', bold: true }, ':', 'JOHNSON']
    ];

    // Items table header and data
    const itemsHeader = [
      { text: 'S.No', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Item Code', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Description', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Un.Na', style: 'itemsTableHeader', alignment: 'center', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Qty', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Rate', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Gross', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'VAT 5%', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'VAT Value', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true },
      { text: 'Net', style: 'itemsTableHeader', alignment: 'right', fontSize: 12, margin: [0, 8, 0, 8], bold: true }
    ];
    const itemsRows = [
      ['1', 'BR 1395 67', { text: 'IRONTABLE 110X30 SIR MORNING BREEZE', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '135.00', alignment: 'right' }, { text: '135.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '6.75', alignment: 'right' }, { text: '141.75', alignment: 'right' }],
      ['2', 'PMR0021055', { text: 'PREMIER SUPER G MIXER GRINDER - 230 V - KM501 C2 (CE) (COC)(UK PLUG)', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '7.45', alignment: 'right' }, { text: '156.45', alignment: 'right' }],
      ['3', 'ANI-BR 4791 68', { text: 'MC RETROBIN-20L ALMOND SLIMLINE', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '60.00', alignment: 'right' }, { text: '60.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '3.00', alignment: 'right' }, { text: '63.00', alignment: 'right' }],
      ['4', 'BR 1499 00', { text: 'NEWICON PEDALBIN-5L Soft Beige', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '2', alignment: 'right' }, { text: '85.00', alignment: 'right' }, { text: '170.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '8.50', alignment: 'right' }, { text: '178.50', alignment: 'right' }],
      ['5', 'BR 3501 84', { text: 'DRYINGRACK-20M T-MODEL GREY', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '149.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '7.45', alignment: 'right' }, { text: '156.45', alignment: 'right' }],
      ['6', '130-95STGBG', { text: '95PC D/SET F.C STINGRAY BEIGEFINE CHINA', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '300.00', alignment: 'right' }, { text: '300.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '15.00', alignment: 'right' }, { text: '315.00', alignment: 'right' }],
      ['7', 'PMR00546', { text: 'S.S. PRESSURE COOKER - COMFORT - 3 LTRS.', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '1', alignment: 'right' }, { text: '79.00', alignment: 'right' }, { text: '79.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '3.95', alignment: 'right' }, { text: '82.95', alignment: 'right' }],
      ['8', 'ANI-BR 1131 47', { text: 'NEWICON PEDALBIN-3L BRILLIANT STEEL', alignment: 'left', fontSize: 10, margin: [0, 4, 0, 4], valign: 'middle' }, 'EA', { text: '2', alignment: 'right' }, { text: '30.00', alignment: 'right' }, { text: '60.00', alignment: 'right' }, { text: '5', alignment: 'right' }, { text: '3.00', alignment: 'right' }, { text: '63.00', alignment: 'right' }]
    ];

    // Details row using the same 10 columns as the items table
    const detailsRow = [
      // Left details (spanning columns 0-4)
      {
        colSpan: 5,
        stack: [
          { text: 'Vendor', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Address', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Tel No', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Fax No', bold: true, margin: [0, 1, 0, 1] },
          { text: 'TRN', bold: true, margin: [0, 1, 0, 1] }
        ]
      }, {}, {}, {}, {},
      // Right details (spanning columns 5-9)
      {
        colSpan: 5,
        stack: [
          { text: 'Doc No : INV-202404937', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Doc Date : 25/09/2024', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Customer Code : 540.Z128', bold: true, margin: [0, 1, 0, 1] },
          { text: 'LPO No :', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Payment Terms : CASH', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Branch : Head Office', bold: true, margin: [0, 1, 0, 1] },
          { text: 'Salesman : JOHNSON', bold: true, margin: [0, 1, 0, 1] }
        ]
      }, {}, {}, {}, {}
    ];

    // Combine all into a single table
    const combinedTable = {
      table: {
        widths: [22, 60, '*', 32, 22, 38, 44, 28, 44, 48],
        body: [
          // TAX INVOICE title row
          [
            { text: 'TAX INVOICE', style: 'taxInvoiceTitle', alignment: 'center', colSpan: 10, margin: [0, 6, 0, 6], fontSize: 14, bold: true },{},{},{},{},{},{},{},{},{}
          ],
          // Details row (spanning columns)
          [
            { colSpan: 5, stack: [
              { text: 'Vendor', bold: true, margin: [0, 1, 0, 1] },
              { text: 'Address', bold: true, margin: [0, 1, 0, 1] },
              { text: 'Tel No', bold: true, margin: [0, 1, 0, 1] },
              { text: 'Fax No', bold: true, margin: [0, 1, 0, 1] },
              { text: 'TRN', bold: true, margin: [0, 1, 0, 1] }
            ] },{},{},{},{},
            { colSpan: 5, stack: [
              { text: 'Doc No : INV-202404937', bold: true, margin: [0, 1, 0, 1] },
              { text: 'Doc Date : 25/09/2024', bold: true, margin: [0, 1, 0, 1] },
              { text: 'Customer Code : 540.Z128', bold: true, margin: [0, 1, 0, 1] },
              { text: 'LPO No :', bold: true, margin: [0, 1, 0, 1] },
              { text: 'Payment Terms : CASH', bold: true, margin: [0, 1, 0, 1] },
              { text: 'Branch : Head Office', bold: true, margin: [0, 1, 0, 1] },
              { text: 'Salesman : JOHNSON', bold: true, margin: [0, 1, 0, 1] }
            ] },{},{},{},{}
          ],
          // Items table header
          itemsHeader,
          // Items table rows
          ...itemsRows
        ]
      },
      layout: {
        fillColor: (rowIndex: number) => (rowIndex === 2 ? '#f0f0f0' : null),
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000',
        vLineColor: () => '#000',
        paddingLeft: () => 2,
        paddingRight: () => 2,
        paddingTop: () => 2,
        paddingBottom: () => 2
      },
      fontSize: 10,
      margin: [0, 10, 0, 0]
    };

    // Amount in words and totals table side by side
    const amountAndTotals = {
      columns: [
        {
          width: '*',
          text: [
            { text: 'AMOUNT IN WORDS : ', bold: true },
            { text: 'AED One Thousand One Hundred Fifty Seven And Ten Fils Only' }
          ],
          fontSize: 11,
          margin: [0, 2, 0, 0],
          alignment: 'left',
        },
        {
          width: 150,
          table: {
            widths: [80, 70],
            body: [
              [
                { text: 'Gross :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '1,102.00', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'Discount Amt :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '0.00', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'Taxable Amt :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '1,102.00', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'VAT :', alignment: 'right', bold: true, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '55.10', alignment: 'right', margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ],
              [
                { text: 'TOTAL :', alignment: 'right', bold: true, fontSize: 12, margin: [0, 2, 0, 2], border: [false, false, false, false] },
                { text: '1,157.10', alignment: 'right', bold: true, fontSize: 12, margin: [0, 2, 0, 2], border: [false, false, false, false] }
              ]
            ]
          },
          layout: 'noBorders',
          alignment: 'right',
          fontSize: 11,
          margin: [0, 2, 0, 0],
        }
      ],
      columnGap: 10
    };

    // Remarks table
    const remarksTable = {
      table: {
        widths: [70, 10, '*'],
        body: [
          [
            { text: 'Remarks', bold: true, alignment: 'left', margin: [4, 2, 0, 2] },
            { text: ':', alignment: 'center', margin: [0, 2, 0, 2] },
            { text: 'LULU GIFT', alignment: 'left', margin: [0, 2, 4, 2] }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000',
        vLineColor: () => '#000'
      },
      margin: [0, 18, 0, 0],
      fontSize: 11
    };

    // Footer section (For company, received, signatures)
    const footerSection = [
      {
        columns: [
          { width: '*', text: [
            'For ',
            { text: 'AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)', bold: true }
          ], margin: [0, 18, 0, 0], fontSize: 12 },
          { width: '*', text: 'Received the above goods in good conditions', alignment: 'right', margin: [0, 18, 0, 0], fontSize: 12 }
        ]
      },
      {
        columns: [
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }] },
              { text: 'Approved By', alignment: 'center', bold: true, margin: [0, 4, 0, 0] },
              { text: 'Print Date & Time :    6/25/2025    2:59 PM', alignment: 'left', fontSize: 9, margin: [0, 8, 0, 0] }
            ]
          },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }] },
              { text: 'Checked By', alignment: 'center', bold: true, margin: [0, 4, 0, 0] },
              { text: 'User :    Pitchai', alignment: 'left', fontSize: 9, margin: [0, 8, 0, 0] }
            ]
          },
          {
            width: '*',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 140, y2: 0, lineWidth: 1 }] },
              { text: 'Received By', alignment: 'center', bold: true, margin: [0, 4, 0, 0] },
              { text: 'Page No :    1', alignment: 'left', fontSize: 9, margin: [0, 8, 0, 0] }
            ]
          }
        ],
        margin: [0, 28, 0, 0]
      }
    ];

    return {
      pageSize: 'A4',
      pageMargins: [40, 30, 40, 30],
      content: [
        // Logo
        {
          image: 'data:image/png;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCADIAMgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigD/2Q==',
          width: 80,
          alignment: 'center',
          margin: [0, 0, 0, 8]
        },
        // Company Name
        {
          text: 'AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)',
          style: 'companyName',
          alignment: 'center',
          margin: [0, 0, 0, 4]
        },
        // Address and Contact
        {
          text: 'POST BOX NO. 4713, DUBAI, U.A.E.\nTEL :04-3536699 FAX :04-3536611 Email : raisem@eim.ae',
          style: 'companyInfo',
          alignment: 'center',
          margin: [0, 0, 0, 2]
        },
        // TRN
        {
          text: 'TRN : 100033732700003',
          style: 'trn',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        // Combined Table (TAX INVOICE, details, items)
        combinedTable,
        // Amount in Words and Totals Table (side by side)
        amountAndTotals,
        // Remarks Table
        remarksTable,
        // Footer Section
        ...footerSection
      ],
      styles: {
        companyName: { fontSize: 16, bold: true },
        companyInfo: { fontSize: 11 },
        trn: { fontSize: 12, bold: true },
        taxInvoiceTitle: { fontSize: 14, bold: true },
        itemsTableHeader: { bold: true, fontSize: 12, fillColor: '#f0f0f0', alignment: 'center' }
      }
    };
  }
}
