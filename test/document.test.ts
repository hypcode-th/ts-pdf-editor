import { PageSizes, TextAlignment } from 'pdf-lib';
import { Document as PDFDocument } from '../src/document';
import { Page } from '../src/page';
import { TextField } from '../src/elements/fields/textfield';
import { Element, ElementType } from '../src/elements/element';
import fs from 'fs';
import { Button } from '../src/elements/fields/button';
import { OptionList } from '../src/elements/fields/optionlist';

describe('test create pdf document with text field', () => {
  test('test', async () => {
    // Load custom fonts
    const customFontMap = new Map<string, string | Uint8Array | ArrayBuffer>();
    customFontMap.set('NotoSansThai-Light', fs.readFileSync('test/fonts/NotoSansThai-Light.ttf'))
    customFontMap.set('NotoSansThai-Medium', fs.readFileSync('test/fonts/NotoSansThai-Medium.ttf'))

    // Create new PDF document
    const pdfDoc = new PDFDocument();

    // Create a new page with A4 size
    // A4: [595.28, 841.89] pt
    const pageWidth = PageSizes.A4[0]
    const pageHeight = PageSizes.A4[1]
    const pdfPage = new Page({
        pageSize: { width: pageWidth, height: pageHeight },  
        font: "NotoSansThai-Light",
    })
    pdfDoc.addPage(pdfPage);

    const pageMargin = 60.0
    const elementWidth = 300.0
    const elementHeight = 30.0
    const elementGap = 10.0
    let currentY = pageHeight - pageMargin

    // Element 1
    currentY = currentY - elementHeight
    const textField = {
        name: 'text_field.0',
        elemType: ElementType.TextField,
        font: "NotoSansThai-Light",
        fontSize: 14,
        x: pageMargin,
        y: currentY,
        width: elementWidth,
        height: elementHeight,
        rotate: 0,
        text: 'ข้อความทดสอบ',
      } as TextField
    pdfPage.addElement(textField as Element)

    // Element 2
    currentY = currentY - elementHeight - elementGap
    const textField2 = {
        name: 'text_field.1',
        elemType: ElementType.TextField,
        font: "NotoSansThai-Light",
        fontSize: 14,
        x: pageMargin,
        y: currentY,
        width: elementWidth,
        height: elementHeight,
        rotate: 0,
        alignment: TextAlignment.Right,
        fitWidth: true,
        fitHeight: true,
        text: '12000',
        locale: 'th-TH',
        style: 'currency',
        currency: 'THB'
      } as TextField
    pdfPage.addElement(textField2 as Element)

    // Element 2
    currentY = currentY - elementHeight - elementGap
    const button = {
        name: 'button.0',
        elemType: ElementType.Button,
        font: "NotoSansThai-Light",
        fontSize: 14,
        x: pageMargin,
        y: currentY,
        width: elementWidth,
        height: elementHeight,
        rotate: 0,
        text: 'ปุ่มทดสอบ',
        backgroundColor: '#EE5522'
      } as Button
    pdfPage.addElement(button as Element)

    // Element 3
    currentY = currentY -(elementHeight * 3) - elementGap
    const optionList = {
        name: 'options.0',
        elemType: ElementType.OptionList,
        font: "NotoSansThai-Light",
        fontSize: 10,
        x: pageMargin,
        y: currentY,
        width: elementWidth,
        height: elementHeight * 3,
        rotate: 0,
        options: ['แดง', 'เขียว', 'น้ำเงิน'],
        selectedOptions: ['น้ำเงิน']
      } as OptionList
    pdfPage.addElement(optionList as Element)

    const output = await pdfDoc.generatePDFFile({
        customFontMap
    })
    fs.writeFileSync(`test/output/${new Date().getTime()}.pdf`, output)
  });
});
