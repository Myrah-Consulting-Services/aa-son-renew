import { Component, OnInit } from '@angular/core';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-inv-template-pur',
  imports: [],
  templateUrl: './inv-template-pur.html',
  styleUrl: './inv-template-pur.scss'
})
export class InvTemplatePur implements OnInit {

  data: any = null;

  constructor(private api:Api){}

  ngOnInit() {
 this.api.get('/invoice/invoice_pdf/'+311+'/').subscribe((res:any)=>{
  console.log(res);
  this.data=res.data
  
 })
  }
  downloadPDF() {
    if (!this.data) {
      alert('Data not loaded yet!');
      return;
    }
    // @ts-ignore
    const pdfMake = window['pdfMake'];
    const d = this.data;
    // Build item rows from API data
    const itemRows = d.items.map((item: any, idx: number) => [
      { text: (idx + 1).toString(), alignment: 'center', fontSize: 9 },
      { text: item.item_info.item_code, alignment: 'center', fontSize: 9 },
      { text: item.itemName, fontSize: 9 },
      { text: item.item_info.units[0]?.name.split(' - ')[0] || '', alignment: 'center', fontSize: 9 },
      { text: item.qty.toFixed(2), alignment: 'right', fontSize: 9 },
      { text: item.rate.toFixed(2), alignment: 'right', fontSize: 9 },
      { text: item.total_amt.toFixed(2), alignment: 'right', fontSize: 9 }
    ]);
    // Calculate totals
    const totalQty = d.items.reduce((sum: number, item: any) => sum + Number(item.qty), 0).toFixed(2);
    const totalGross = d.items.reduce((sum: number, item: any) => sum + Number(item.total_amt), 0).toFixed(2);
    // Charges section rows
    const chargesRows = [
      [
        { text: 'Customs Payable', bold: true, fontSize: 9, margin: [0,0,0,0] },
        { text: d.customs_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0,0,0,0] },
        { text: 'Insurance Payable', bold: true, fontSize: 9, margin: [0,0,0,0] },
        { text: d.insurance_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0,0,0,0] },
        { text: 'Demurage (AED)', bold: true, fontSize: 9, margin: [0,0,0,0] },
        { text: d.demurage?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0,0,0,0] },
        { text: 'Total Net :', bold: true, alignment: 'right', rowSpan: 3, valign: 'middle', fontSize: 9, noWrap: true, margin: [0,0,0,0] },
        { text: d.final_total_amount?.toFixed(2) || '0.00', bold: true, alignment: 'right', rowSpan: 3, valign: 'middle', fontSize: 9, noWrap: true, margin: [0,0,0,0] }
      ],
      [
        { text: 'Freight Payable', bold: true, fontSize: 9, margin: [0,0,0,0] },
        { text: d.freight_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0,0,0,0] },
        { text: 'Port Charge Payable', bold: true, fontSize: 9, margin: [0,0,0,0] },
        { text: d.port_Charge_Payable?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0,0,0,0] },
        { text: 'Carriage Inwards', bold: true, fontSize: 9, margin: [0,0,0,0] },
        { text: d.carriage_Inwards?.toFixed(2) || '0.00', fontSize: 9, margin: [0,0,0,0] },
        {},
        {}
      ],
      [
        { text: 'THC & DO Charges', bold: true, fontSize: 9, margin: [0,0,0,0] },
        { text: d.thc_Charges?.toFixed(2) || '0.00', fontSize: 9, margin: [0,0,0,0] },
        { text: 'Bank Charge Payable', bold: true, fontSize: 9, margin: [0,0,0,0] },
        { text: d.bank_Charge_Payable?.toFixed(2) || '0.00', fontSize: 9, margin: [0,0,0,0] },
        { text: 'Misc. & Others', bold: true, color: '#2222ee', fontSize: 9, margin: [0,0,0,0] },
        { text: d.misc_Others?.toFixed(2) || '0.00', alignment: 'right', fontSize: 9, margin: [0,0,0,0] },
        {},
        {}
      ]
    ];
    // @ts-ignore
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [10, 10, 10, 10],
      footer: function(currentPage: number, pageCount: number) {
        return {
          columns: [
            { text: 'Print Date & Time :      6/25/2025    2:56 PM', alignment: 'left', fontSize: 9 },
            { text: 'User :   Pitchai', alignment: 'center', fontSize: 9 },
            { text: 'Page No :    ' + currentPage, alignment: 'right', fontSize: 9 }
          ],
          margin: [40, 0]
        };
      },
      content: [
        {
          table: {
            headerRows: 4,
            widths: [25, 55, '*', 30, 35, 35, 45],
            body: [
              // Company info row (spans all columns)
              [
                {
                  colSpan: 7,
                  stack: [
                    { text: 'AA SONS', fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
                    { text: 'AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)', fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
                    { text: 'POST BOX NO. 4713,DUBAI, U.A.E.', fontSize: 10, alignment: 'center', margin: [0, 0, 0, 0] },
                    { text: 'TEL :04-3536699 FAX :04-3536611 Email : raisem@eim.ae', fontSize: 10, alignment: 'center', margin: [0, 0, 0, 0] },
                    { text: 'TRN : 100033732700003', fontSize: 11, bold: true, alignment: 'center', color: '#000', margin: [0, 0, 0, 6] }
                  ],
                  alignment: 'center',
                  margin: [0, 4, 0, 4]
                }, {}, {}, {}, {}, {}, {}
              ],
              // Section header row (spans all columns)
              [
                {
                  colSpan: 7,
                  text: 'MATERIAL RECEIPT NOTE IMPORT',
                  bold: true,
                  fontSize: 14,
                  alignment: 'center',
                  margin: [0, 2, 0, 2]
                }, {}, {}, {}, {}, {}, {}
              ],
              // Details row (as before, using colSpan for left/right blocks)
              [
                { colSpan: 3, stack: [
                    { text: [ { text: 'Vendor     : ', bold: true, fontSize: 9 }, { text: d.party_name, fontSize: 9 } ], margin: [0, 0, 0, 1] },
                    { text: [ { text: 'Address    : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 } ], margin: [0, 0, 0, 0] },
                    { text: '', fontSize: 9, margin: [65, 0, 0, 1] },
                    { text: [ { text: 'Tel No     : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 } ], margin: [0, 0, 0, 1] },
                    { text: [ { text: 'Fax No     : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 } ], margin: [0, 0, 0, 1] },
                    { text: [ { text: 'TRN        : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 } ], margin: [0, 0, 0, 1] }
                  ] }, {}, {},
                { colSpan: 4, stack: [
                    { text: [ { text: 'Doc No         : ', bold: true, fontSize: 9 }, { text: d.invoice_no, fontSize: 9 } ], margin: [0, 0, 0, 1] },
                    { text: [ { text: 'Doc Date       : ', bold: true, fontSize: 9 }, { text: d.invoice_date, fontSize: 9 } ], margin: [0, 0, 0, 1] },
                    { text: [ { text: 'Currency       : ', bold: true, fontSize: 9 }, { text: 'USD', fontSize: 9 } ], margin: [0, 0, 0, 1] },
                    { text: [ { text: 'Expt Dly Date  : ', bold: true, fontSize: 9 }, { text: d.due_date, fontSize: 9 } ], margin: [0, 0, 0, 1] },
                    { text: [ { text: 'Payment Terms  : ', bold: true, fontSize: 9 }, { text: d.terms?.toString() || '', fontSize: 9 } ], margin: [0, 0, 0, 1] },
                    { text: [ { text: 'Outlet         : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 } ], margin: [0, 0, 0, 1] },
                    { text: [ { text: 'Branch         : ', bold: true, fontSize: 9 }, { text: '', fontSize: 9 } ], margin: [0, 0, 0, 1] }
                  ] }, {}, {}, {}
              ],
              // Items table header
              [
                { text: 'S.No', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Item Code', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Description', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Unit', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Qty', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Rate', bold: true, alignment: 'center', fontSize: 9 },
                { text: 'Gross', bold: true, alignment: 'center', fontSize: 9 }
              ],
              ...itemRows,
              // Row for totals (Qty and Gross)
              [
                { colSpan: 4, text: 'Page Total', alignment: 'center', border: [true, false, false, false] }, {}, {}, {},
                { text: totalQty, bold: true, italics: true, alignment: 'right', border: [false, false, false, false] },
                { text: '', border: [false, false, false, false] },
                { text: totalGross, bold: true, italics: true, alignment: 'right', border: [false, false, true, false] }
              ],
            ],
            layout: {
              hLineWidth: function(i: any, node: any) {
                // Top, section header (top and bottom), header, and bottom borders
                if (i === 0 || i === 1 || i === 2 || i === 3 || i===4 || i===18 || i === node.table.body.length) return 1;
                return 0;
              },
              vLineWidth: function(i: any, node: any) {
                // Only leftmost and rightmost vertical lines
                if (i === 0 || i === node.table.widths.length) return 1;
                return 0;
              },
              hLineColor: function(i: any, node: any) { return 'black'; },
              vLineColor: function(i: any, node: any) { return 'black'; }
            },
            styles: {
              logoText: { fontSize: 28, bold: true, color: '#222' },
              companyName: { fontSize: 16, bold: true },
              trnBold: { fontSize: 12, bold: true },
              sectionTitle: { fontSize: 14, bold: true },
            }
          }
        },
        // Add a new section below the main table for Total Discount and Total Gross
        {
          table: {
            widths: ['*', 120, 60],
            body: [
              [
                { text: '', colSpan: 1 },
                { text: 'Total Discount :', alignment: 'right', bold: true },
                { text: d.total_discount?.toFixed(2) || '0.00', alignment: 'right' }
              ],
              [
                { text: '', colSpan: 1 },
                { text: 'Total Gross :', alignment: 'right', bold: true },
                { text: d.final_total_amount?.toFixed(2) || '0.00', alignment: 'right' }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) {
              // Only top border for first row, bottom border for last row
              if (i === node.table.body.length) return 1;
              return 0;
            },
            vLineWidth: function(i: number, node: any) {
              // Only leftmost and rightmost vertical lines
              if (i === 0 || i === node.table.widths.length) return 1;
              return 0;
            },
            hLineColor: function(i: any, node: any) { return 'black'; },
            vLineColor: function(i: any, node: any) { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        // Charges section
        {
          table: {
            widths: [70, 60, 70, 60, 60, 60, 60,62],
            body: chargesRows
          },
          layout: {
            hLineWidth: function(i: number) { return 1; },
            vLineWidth: function(i: number) { return 1; },
            hLineColor: function() { return 'black'; },
            vLineColor: function() { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        // Amount in words row
        {
          table: {
            widths: [120, '*'],
            body: [
              [
                { text: 'Amount in words :', bold: true, fontSize: 10, margin: [0, 0, 0, 0] },
                { text: 'USD Two Hundred Twelve Thousand Eight Hundred Twenty Four and Fifty One Pounds Only', fontSize: 10, margin: [0, 0, 0, 0] }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number) { return 1; },
            vLineWidth: function(i: number) { return 1; },
            hLineColor: function() { return 'black'; },
            vLineColor: function() { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        // Remarks row
        {
          table: {
            widths: [80, '*'],
            body: [
              [
                { text: 'Remarks', bold: true, fontSize: 11, margin: [0, 0, 0, 0] },
                { text: d.notes || ':', fontSize: 11, margin: [0, 0, 0, 0] }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number) { return 1; },
            vLineWidth: function(i: number) { return 1; },
            hLineColor: function() { return 'black'; },
            vLineColor: function() { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        // Signature section with outer border
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: 'For      AHMAD ABDULRAHMAN & SONS GENERAL TRADING (LLC)', bold: false, fontSize: 12, margin: [0, 8, 0, 8] },
                    {
                      table: {
                        widths: ['33%', '33%', '34%'],
                        body: [
                          [
                            { text: 'Prepared By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] },
                            { text: 'Checked By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] },
                            { text: 'Approved By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] }
                          ]
                        ]
                      },
                      layout: 'noBorders',
                      margin: [0, 0, 0, 0]
                    }
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number) { return 1; },
            vLineWidth: function(i: number) { return 1; },
            hLineColor: function() { return 'black'; },
            vLineColor: function() { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        }
      ]
    };
  // @ts-ignore
  pdfMake.createPdf(docDefinition).download('Material_Receipt_Note_Header.pdf');
  }
}
