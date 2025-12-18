/**
 * PDF Generation for CMR Documents
 *
 * =============================================================================
 * OVERVIEW - Paper CMR Mapping
 * =============================================================================
 *
 * This generator creates a digital PDF that closely matches the official
 * CMR transport document (Convention relative au contrat de transport
 * international de marchandises par route).
 *
 * The paper CMR form has 24 numbered boxes organized as follows:
 *
 * HEADER SECTION:
 * - CMR number (our: cmr_number)
 * - International/National flag (our: is_international)
 *
 * PARTIES (Boxes 1-3):
 * - Box 1: Sender/Shipper (Expéditeur) - shipper_name, shipper_address
 * - Box 2: Carrier/Transporter (Transporteur) - from profiles table (company_name, company_address, SIREN, SIRET)
 * - Box 3: Consignee (Destinataire) - consignee_name, consignee_address
 *
 * ADDITIONAL PARTIES:
 * - Principal/Ordering party (Donneur d'ordres) - principal_name, principal_address
 * - Successive carrier (Transporteur successif) - delivery_carrier_name, delivery_carrier_address
 *
 * LOADING/DELIVERY (Boxes 4-7):
 * - Box 4: Loading place, date - loading_place, loading_date
 * - Box 5: Documents attached - attached_documents
 * - Box 6: Delivery place - delivery_place
 * - Box 7: Delivery date - requested_delivery_at
 *
 * GOODS INFORMATION (Boxes 8-14):
 * - Box 8: Marks and numbers - goods_marks_numbers
 * - Box 9: Number of packages - packages_count
 * - Box 10: Packaging method - packaging_type
 * - Box 11: Nature of goods - goods_description
 * - Box 12: Statistical number (not used)
 * - Box 13: Gross weight (kg) - weight_kg
 * - Box 14: Volume/Cube (not used)
 *
 * SPECIAL CONDITIONS (Extensions):
 * - Dangerous goods (ADR) - is_dangerous_goods, dangerous_goods_class, dangerous_goods_un_number, dangerous_goods_adr_letter
 * - Temperature control - is_controlled_temperature, temperature_min, temperature_max
 *
 * PALLETS (Box 15):
 * - pallets_80_120, pallets_100_120, pallets_europe, pallets_others, pallets_bacs, pallets_rolls
 * - pallets_origin, pallets_final_balance
 *
 * INSTRUCTIONS (Boxes 16-17):
 * - Box 16: Sender's instructions - instructions
 * - Box 17: Customs instructions (international) - customs_instructions
 *
 * FINANCIAL (Boxes 18-22):
 * - Box 18: Sender's instructions for payment
 * - Box 19: Reimbursements (not used)
 * - Box 20: Cash on delivery - cash_on_delivery_amount, cash_on_delivery_currency
 * - Box 21: Freight charges - freight_total_amount, freight_currency, freight_terms
 * - Box 22: Special agreements (not used)
 *
 * RESERVES & SIGNATURES (Boxes 23-24):
 * - Box 23: Reserves and observations at loading - loading reserves
 * - Box 24: Consignee reserves at delivery - delivery reserves
 * - Signatures: shipper signature, carrier signature (driver), consignee signature
 *
 * TIMESTAMPS (Extended for digital tracking):
 * - loading_arrival_at, loading_departure_at
 * - delivery_arrival_at, delivery_departure_at
 *
 * =============================================================================
 */

import jsPDF from 'jspdf';
import type { Database } from '@/types/database.types';

type CmrDocument = Database['public']['Tables']['cmr_documents']['Row'];
type CmrSignature = Database['public']['Tables']['cmr_signatures']['Row'];
type CmrReserve = Database['public']['Tables']['cmr_reserves']['Row'];
type CmrPhoto = Database['public']['Tables']['cmr_photos']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface GeneratePdfOptions {
  cmr: CmrDocument;
  profile?: Profile | null; // Transporter info (Box 2 on paper CMR)
  shipperSignature?: (CmrSignature & { signatureUrl?: string | null }) | null;
  consigneeSignature?: (CmrSignature & { signatureUrl?: string | null }) | null;
  reserves?: (CmrReserve & { photoUrl?: string | null })[];
  photos?: (CmrPhoto & { photoUrl?: string | null })[];
}

/**
 * Generate a PDF document for a CMR with full information
 *
 * This function creates a comprehensive CMR PDF that includes all fields
 * from the digital CMR system, organized to match the official paper CMR layout.
 *
 * @param options - CMR document, profile (for transporter), signatures, reserves, and photos
 * @returns The jsPDF instance (can be used to save or get blob)
 */
export async function generateCmrPdf({
  cmr,
  profile,
  shipperSignature,
  consigneeSignature,
  reserves = [],
  photos = [],
}: GeneratePdfOptions): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPos = 15;
  const leftMargin = 15;
  const rightMargin = 15;
  const lineHeight = 6;
  const contentWidth = pageWidth - leftMargin - rightMargin;

  // Helper to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Helper to add text
  const addText = (text: string, fontSize: number = 9, isBold: boolean = false, xOffset: number = 0) => {
    checkPageBreak(lineHeight);
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.text(text, leftMargin + xOffset, yPos);
    yPos += lineHeight;
  };

  // Helper to add section title
  const addSection = (title: string, boxNumber?: string) => {
    checkPageBreak(lineHeight + 4);
    yPos += 2;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const displayTitle = boxNumber ? `${boxNumber}. ${title}` : title;
    pdf.text(displayTitle, leftMargin, yPos);
    yPos += lineHeight;
    // Add underline
    pdf.line(leftMargin, yPos - 1, pageWidth - rightMargin, yPos - 1);
    yPos += 2;
  };

  // Helper to add subsection
  const addSubSection = (title: string, fontSize: number = 10) => {
    checkPageBreak(lineHeight);
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, leftMargin, yPos);
    yPos += lineHeight;
  };

  // Helper for two-column layout
  const addTwoColumns = (left: string, right: string, fontSize: number = 9) => {
    checkPageBreak(lineHeight);
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'normal');
    pdf.text(left, leftMargin, yPos);
    pdf.text(right, pageWidth / 2, yPos);
    yPos += lineHeight;
  };

  // =============================================================================
  // HEADER - CMR TITLE AND NUMBER
  // =============================================================================
  pdf.setFillColor(230, 230, 250); // Light purple background
  pdf.rect(leftMargin, yPos, contentWidth, 15, 'F');

  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CMR', pageWidth / 2, yPos + 6, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Convention relative au contrat de transport', pageWidth / 2, yPos + 11, { align: 'center' });
  pdf.text('international de marchandises par route', pageWidth / 2, yPos + 14, { align: 'center' });

  yPos += 17;

  // CMR Number and Type
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  const cmrNumberText = cmr.cmr_number ? `CMR N°: ${cmr.cmr_number}` : `CMR ID: ${cmr.id.substring(0, 8)}`;
  pdf.text(cmrNumberText, leftMargin, yPos);

  const transportType = cmr.is_international ? 'INTERNATIONAL' : 'NATIONAL';
  if (cmr.is_international) {
    pdf.setTextColor(200, 0, 0); // Red for international
  } else {
    pdf.setTextColor(0, 100, 0); // Green for national
  }
  pdf.text(transportType, pageWidth - rightMargin, yPos, { align: 'right' });
  pdf.setTextColor(0, 0, 0); // Reset to black
  yPos += lineHeight + 3;

  // Status badge
  const statusText = cmr.status.toUpperCase().replace(/_/g, ' ');
  const statusColor =
    cmr.status === 'completed' || cmr.status === 'completed_with_reserves'
      ? [34, 197, 94]
      : [156, 163, 175];
  pdf.setFontSize(9);
  pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.text(`Status: ${statusText}`, pageWidth - rightMargin, yPos, { align: 'right' });
  pdf.setTextColor(0, 0, 0);
  yPos += lineHeight + 5;

  // =============================================================================
  // SECTION: PARTIES (Boxes 1-3)
  // Paper CMR: Expéditeur, Transporteur, Destinataire
  // =============================================================================
  addSection('PARTIES', '1-3');

  // Box 1: SHIPPER (Expéditeur)
  addSubSection('1. Sender / Shipper (Expéditeur)');
  addText(`Name: ${cmr.shipper_name}`, 9, true);
  if (cmr.shipper_address) {
    const addressLines = pdf.splitTextToSize(`Address: ${cmr.shipper_address}`, contentWidth);
    for (const line of addressLines) {
      addText(line, 9);
    }
  }
  yPos += 2;

  // Box 2: TRANSPORTER (Transporteur / Carrier)
  // This comes from the profiles table, NOT from cmr_documents
  addSubSection('2. Carrier / Transporter (Transporteur)');
  if (profile) {
    if (profile.company_name) {
      addText(`Company: ${profile.company_name}`, 9, true);
    }
    if (profile.company_address) {
      const addressLines = pdf.splitTextToSize(`Address: ${profile.company_address}`, contentWidth);
      for (const line of addressLines) {
        addText(line, 9);
      }
    }

    // Company registration numbers on same line
    const regNumbers: string[] = [];
    if (profile.company_siren) regNumbers.push(`SIREN: ${profile.company_siren}`);
    if (profile.company_siret) regNumbers.push(`SIRET: ${profile.company_siret}`);
    if (profile.company_naf) regNumbers.push(`NAF: ${profile.company_naf}`);
    if (regNumbers.length > 0) {
      addText(regNumbers.join(' | '), 8);
    }

    if (profile.phone) {
      addText(`Phone: ${profile.phone}`, 9);
    }
    if (profile.billing_email) {
      addText(`Email: ${profile.billing_email}`, 9);
    }
  } else {
    pdf.setFont('helvetica', 'italic');
    addText('Transporter information not available', 9);
  }
  yPos += 2;

  // Box 3: CONSIGNEE (Destinataire)
  addSubSection('3. Consignee (Destinataire)');
  addText(`Name: ${cmr.consignee_name}`, 9, true);
  if (cmr.consignee_address) {
    const addressLines = pdf.splitTextToSize(`Address: ${cmr.consignee_address}`, contentWidth);
    for (const line of addressLines) {
      addText(line, 9);
    }
  }
  yPos += 2;

  // ADDITIONAL PARTIES (not numbered boxes on paper CMR, but important)
  if (cmr.principal_name || cmr.delivery_carrier_name) {
    addSubSection('Additional Parties');

    if (cmr.principal_name) {
      addText('Principal / Ordering Party (Donneur d\'ordres):', 9, true);
      addText(`  ${cmr.principal_name}`, 9);
      if (cmr.principal_address) {
        const addressLines = pdf.splitTextToSize(`  ${cmr.principal_address}`, contentWidth - 5);
        for (const line of addressLines) {
          addText(line, 9);
        }
      }
      yPos += 1;
    }

    if (cmr.delivery_carrier_name) {
      addText('Successive Carrier (Transporteur successif):', 9, true);
      addText(`  ${cmr.delivery_carrier_name}`, 9);
      if (cmr.delivery_carrier_address) {
        const addressLines = pdf.splitTextToSize(`  ${cmr.delivery_carrier_address}`, contentWidth - 5);
        for (const line of addressLines) {
          addText(line, 9);
        }
      }
    }
    yPos += 2;
  }

  yPos += 3;

  // =============================================================================
  // SECTION: LOADING & DELIVERY LOCATIONS (Boxes 4, 6, 7)
  // Paper CMR: Lieu et date de la prise en charge, Lieu de livraison
  // =============================================================================
  addSection('LOADING & DELIVERY', '4, 6-7');

  // Box 4: Loading place and date
  addSubSection('4. Loading Place and Date (Lieu et date de la prise en charge)');
  addText(`Place: ${cmr.loading_place}`, 9, true);
  addText(`Planned Date: ${new Date(cmr.loading_date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`, 9);

  // Extended timestamps (digital tracking)
  if (cmr.loading_arrival_at || cmr.loading_departure_at) {
    addText('Actual Timestamps:', 9, true);
    if (cmr.loading_arrival_at) {
      addText(`  Arrived: ${new Date(cmr.loading_arrival_at).toLocaleString('fr-FR')}`, 8);
    }
    if (cmr.loading_departure_at) {
      addText(`  Departed: ${new Date(cmr.loading_departure_at).toLocaleString('fr-FR')}`, 8);
    }
  }

  if (cmr.loading_extra_services) {
    addText(`Extra Services: ${cmr.loading_extra_services}`, 9);
  }
  yPos += 2;

  // Box 6: Delivery place
  addSubSection('6. Delivery Place (Lieu de livraison)');
  addText(`Place: ${cmr.delivery_place}`, 9, true);

  // Box 7: Delivery date
  if (cmr.requested_delivery_at) {
    addText(`Requested Delivery: ${new Date(cmr.requested_delivery_at).toLocaleString('fr-FR')}`, 9);
  }

  // Extended timestamps (digital tracking)
  if (cmr.delivery_arrival_at || cmr.delivery_departure_at) {
    addText('Actual Timestamps:', 9, true);
    if (cmr.delivery_arrival_at) {
      addText(`  Arrived: ${new Date(cmr.delivery_arrival_at).toLocaleString('fr-FR')}`, 8);
    }
    if (cmr.delivery_departure_at) {
      addText(`  Departed: ${new Date(cmr.delivery_departure_at).toLocaleString('fr-FR')}`, 8);
    }
  }

  if (cmr.delivery_extra_services) {
    addText(`Extra Services: ${cmr.delivery_extra_services}`, 9);
  }
  yPos += 3;

  // =============================================================================
  // SECTION: GOODS INFORMATION (Boxes 8-14)
  // Paper CMR: Marques et numéros, Nombre de colis, Mode d'emballage,
  //            Nature de la marchandise, Poids brut
  // =============================================================================
  addSection('GOODS INFORMATION', '8-14');

  // Box 11: Nature of goods (most important, shown first)
  addSubSection('11. Description / Nature of Goods (Nature de la marchandise)');
  if (cmr.goods_description) {
    const descLines = pdf.splitTextToSize(cmr.goods_description, contentWidth);
    for (const line of descLines) {
      addText(line, 9);
    }
  } else {
    addText('N/A', 9);
  }
  yPos += 2;

  // Boxes 9, 10, 13: Packages, Packaging, Weight
  addSubSection('Package Details');
  addTwoColumns(
    `9. Packages: ${cmr.packages_count || 'N/A'}`,
    `10. Packaging: ${cmr.packaging_type || 'N/A'}`
  );
  addTwoColumns(
    `13. Gross Weight: ${cmr.weight_kg ? `${cmr.weight_kg} kg` : 'N/A'}`,
    `14. Volume: ${cmr.declared_value ? `${cmr.declared_value} ${cmr.declared_value_currency || 'EUR'}` : 'N/A'}`
  );
  yPos += 1;

  // Box 8: Marks and numbers
  if (cmr.goods_marks_numbers) {
    addText(`8. Marks & Numbers: ${cmr.goods_marks_numbers}`, 9);
    yPos += 1;
  }

  yPos += 2;

  // =============================================================================
  // SPECIAL CONDITIONS: DANGEROUS GOODS (ADR)
  // Extension to standard CMR for hazardous materials
  // =============================================================================
  if (cmr.is_dangerous_goods) {
    checkPageBreak(25);

    // Draw warning box
    pdf.setFillColor(255, 237, 213); // Orange background
    pdf.setDrawColor(255, 140, 0); // Orange border
    const boxHeight = 20;
    pdf.rect(leftMargin, yPos, contentWidth, boxHeight, 'FD');
    yPos += 4;

    addSubSection('⚠ DANGEROUS GOODS (ADR) - Matières Dangereuses');
    yPos -= 1;

    if (cmr.dangerous_goods_class) {
      addText(`  Class: ${cmr.dangerous_goods_class}`, 9);
    }
    if (cmr.dangerous_goods_un_number) {
      addText(`  UN Number: ${cmr.dangerous_goods_un_number}`, 9);
    }
    if (cmr.dangerous_goods_adr_letter) {
      addText(`  ADR Letter: ${cmr.dangerous_goods_adr_letter}`, 9);
    }

    yPos += 3;
  }

  // =============================================================================
  // SPECIAL CONDITIONS: TEMPERATURE CONTROL
  // Extension for refrigerated/frozen transport
  // =============================================================================
  if (cmr.is_controlled_temperature) {
    checkPageBreak(15);

    // Draw info box
    pdf.setFillColor(219, 234, 254); // Blue background
    pdf.setDrawColor(59, 130, 246); // Blue border
    const boxHeight = 12;
    pdf.rect(leftMargin, yPos, contentWidth, boxHeight, 'FD');
    yPos += 4;

    addSubSection('❄ TEMPERATURE CONTROLLED - Transport Frigorifique');
    yPos -= 1;

    const tempInfo: string[] = [];
    if (cmr.temperature_min !== null) tempInfo.push(`Min: ${cmr.temperature_min}°C`);
    if (cmr.temperature_max !== null) tempInfo.push(`Max: ${cmr.temperature_max}°C`);
    if (tempInfo.length > 0) {
      addText(`  ${tempInfo.join(' | ')}`, 9);
    }

    yPos += 3;
  }

  // =============================================================================
  // SECTION: PALLETS (Box 15)
  // Paper CMR: Échange de palettes / Pallet exchange
  // =============================================================================
  const hasPallets = cmr.pallets_80_120 || cmr.pallets_100_120 || cmr.pallets_europe ||
                     cmr.pallets_others || cmr.pallets_bacs || cmr.pallets_rolls;

  if (hasPallets) {
    addSection('PALLETS & SUPPORTS', '15');

    const palletLines: string[] = [];
    if (cmr.pallets_80_120 && cmr.pallets_80_120 > 0) palletLines.push(`80x120: ${cmr.pallets_80_120}`);
    if (cmr.pallets_100_120 && cmr.pallets_100_120 > 0) palletLines.push(`100x120: ${cmr.pallets_100_120}`);
    if (cmr.pallets_europe && cmr.pallets_europe > 0) palletLines.push(`Euro: ${cmr.pallets_europe}`);
    if (cmr.pallets_others && cmr.pallets_others > 0) palletLines.push(`Others: ${cmr.pallets_others}`);
    if (cmr.pallets_bacs && cmr.pallets_bacs > 0) palletLines.push(`Bacs: ${cmr.pallets_bacs}`);
    if (cmr.pallets_rolls && cmr.pallets_rolls > 0) palletLines.push(`Rolls: ${cmr.pallets_rolls}`);

    if (palletLines.length > 0) {
      addText(palletLines.join(' | '), 9);
    }

    if (cmr.pallets_origin) {
      addText(`Origin: ${cmr.pallets_origin}`, 9);
    }

    // Pallet exchange details
    if (cmr.pallets_loaded_at_shipper || cmr.pallets_returned_to_shipper ||
        cmr.pallets_delivered_to_consignee || cmr.pallets_returned_by_consignee) {
      yPos += 1;
      addText('Pallet Exchange:', 9, true);
      if (cmr.pallets_loaded_at_shipper) {
        addText(`  Loaded at shipper: ${cmr.pallets_loaded_at_shipper}`, 8);
      }
      if (cmr.pallets_returned_to_shipper) {
        addText(`  Returned to shipper: ${cmr.pallets_returned_to_shipper}`, 8);
      }
      if (cmr.pallets_delivered_to_consignee) {
        addText(`  Delivered to consignee: ${cmr.pallets_delivered_to_consignee}`, 8);
      }
      if (cmr.pallets_returned_by_consignee) {
        addText(`  Returned by consignee: ${cmr.pallets_returned_by_consignee}`, 8);
      }
    }

    if (cmr.pallets_deposited_at) {
      addText(`Deposited at: ${cmr.pallets_deposited_at}`, 9);
    }

    if (cmr.pallets_final_balance) {
      const balanceLines = pdf.splitTextToSize(`Final Balance: ${cmr.pallets_final_balance}`, contentWidth);
      for (const line of balanceLines) {
        addText(line, 9);
      }
    }

    yPos += 3;
  }

  // =============================================================================
  // SECTION: DOCUMENTS (Box 5)
  // Paper CMR: Documents annexés
  // =============================================================================
  if (cmr.attached_documents) {
    addSection('ATTACHED DOCUMENTS', '5');
    const docLines = pdf.splitTextToSize(cmr.attached_documents, contentWidth);
    for (const line of docLines) {
      addText(line, 9);
    }
    yPos += 3;
  }

  // =============================================================================
  // SECTION: INSTRUCTIONS (Boxes 16-17)
  // Paper CMR: Instructions de l'expéditeur, Instructions douanières
  // =============================================================================
  if (cmr.instructions || cmr.customs_instructions) {
    addSection('INSTRUCTIONS', '16-17');

    // Box 16: Sender's instructions
    if (cmr.instructions) {
      addSubSection('16. Sender\'s Instructions (Instructions de l\'expéditeur)');
      const instructionLines = pdf.splitTextToSize(cmr.instructions, contentWidth);
      for (const line of instructionLines) {
        addText(line, 9);
      }
      yPos += 2;
    }

    // Box 17: Customs instructions (for international transport)
    if (cmr.customs_instructions) {
      addSubSection('17. Customs Instructions (Instructions douanières)');
      const customsLines = pdf.splitTextToSize(cmr.customs_instructions, contentWidth);
      for (const line of customsLines) {
        addText(line, 9);
      }
      yPos += 2;
    }

    yPos += 1;
  }

  // =============================================================================
  // SECTION: FINANCIAL INFORMATION (Boxes 20-21)
  // Paper CMR: Remboursement, Port, Frais
  // =============================================================================
  const hasFinancial = cmr.cash_on_delivery_amount || cmr.freight_total_amount || cmr.freight_terms;

  if (hasFinancial) {
    addSection('FINANCIAL INFORMATION', '20-21');

    // Box 20: Cash on Delivery (Remboursement)
    if (cmr.cash_on_delivery_amount && cmr.cash_on_delivery_amount > 0) {
      checkPageBreak(12);

      // Draw warning box for COD
      pdf.setFillColor(254, 249, 195); // Yellow background
      pdf.setDrawColor(250, 204, 21); // Yellow border
      const boxHeight = 10;
      pdf.rect(leftMargin, yPos, contentWidth, boxHeight, 'FD');
      yPos += 4;

      addSubSection('20. Cash on Delivery (Contre-Remboursement)');
      yPos -= 1;
      addText(`  Amount: ${cmr.cash_on_delivery_amount} ${cmr.cash_on_delivery_currency || 'EUR'}`, 10, true);

      yPos += 4;
    }

    // Box 21: Freight charges
    if (cmr.freight_total_amount || cmr.freight_terms) {
      addSubSection('21. Freight Charges (Port et frais)');
      if (cmr.freight_total_amount) {
        addText(`Amount: ${cmr.freight_total_amount} ${cmr.freight_currency || 'EUR'}`, 9);
      }
      if (cmr.freight_terms) {
        addText(`Terms: ${cmr.freight_terms}`, 9);
      }
      yPos += 2;
    }

    yPos += 1;
  }

  // =============================================================================
  // SECTION: PHOTOS
  // Digital extension - proof of loading/delivery condition
  // =============================================================================
  if (photos && photos.length > 0) {
    addSection('PHOTOS', '');
    addText(`${photos.length} photo(s) attached`, 9);
    yPos += 2;

    for (const photo of photos) {
      if (photo.photoUrl) {
        try {
          checkPageBreak(70);
          const response = await fetch(photo.photoUrl);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          const imgWidth = 90;
          const imgHeight = 65;
          pdf.addImage(base64, 'JPEG', leftMargin, yPos, imgWidth, imgHeight);
          yPos += imgHeight + 5;
        } catch (error) {
          console.error('Failed to add photo:', error);
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(8);
          pdf.text('[Photo not available]', leftMargin, yPos);
          yPos += lineHeight;
        }
      }
    }

    yPos += 3;
  }

  // =============================================================================
  // SECTION: RESERVES (Box 23-24)
  // Paper CMR: Réserves et observations
  // =============================================================================
  if (reserves && reserves.length > 0) {
    addSection('RESERVES & OBSERVATIONS', '23-24');

    const loadingReserves = reserves.filter((r) => r.side === 'loading');
    const deliveryReserves = reserves.filter((r) => r.side === 'delivery');

    // Box 23: Loading reserves
    if (loadingReserves.length > 0) {
      addSubSection('23. Reserves at Loading (Réserves au chargement)');
      yPos += 1;

      for (const reserve of loadingReserves) {
        checkPageBreak(35);

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`• ${reserve.reserve_type}`, leftMargin + 3, yPos);
        yPos += lineHeight;

        if (reserve.comment) {
          pdf.setFont('helvetica', 'normal');
          const commentLines = pdf.splitTextToSize(reserve.comment, contentWidth - 8);
          for (const line of commentLines) {
            checkPageBreak(lineHeight);
            pdf.text(line, leftMargin + 6, yPos);
            yPos += lineHeight;
          }
        }

        // Add photo if available
        if (reserve.photoUrl) {
          try {
            checkPageBreak(50);
            const response = await fetch(reserve.photoUrl);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });

            const imgWidth = 60;
            const imgHeight = 45;
            pdf.addImage(base64, 'JPEG', leftMargin + 6, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 5;
          } catch (error) {
            console.error('Failed to add reserve photo:', error);
          }
        }

        yPos += 2;
      }

      yPos += 2;
    }

    // Box 24: Delivery reserves
    if (deliveryReserves.length > 0) {
      addSubSection('24. Reserves at Delivery (Réserves à la livraison)');
      yPos += 1;

      for (const reserve of deliveryReserves) {
        checkPageBreak(35);

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`• ${reserve.reserve_type}`, leftMargin + 3, yPos);
        yPos += lineHeight;

        if (reserve.comment) {
          pdf.setFont('helvetica', 'normal');
          const commentLines = pdf.splitTextToSize(reserve.comment, contentWidth - 8);
          for (const line of commentLines) {
            checkPageBreak(lineHeight);
            pdf.text(line, leftMargin + 6, yPos);
            yPos += lineHeight;
          }
        }

        // Add photo if available
        if (reserve.photoUrl) {
          try {
            checkPageBreak(50);
            const response = await fetch(reserve.photoUrl);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });

            const imgWidth = 60;
            const imgHeight = 45;
            pdf.addImage(base64, 'JPEG', leftMargin + 6, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 5;
          } catch (error) {
            console.error('Failed to add reserve photo:', error);
          }
        }

        yPos += 2;
      }
    }

    yPos += 3;
  }

  // =============================================================================
  // SECTION: SIGNATURES
  // Paper CMR: Signatures of Sender (Box 23), Carrier, and Receiver (Box 24)
  // =============================================================================
  addSection('SIGNATURES', '');

  // Shipper Signature (corresponds to Box 23 on paper CMR)
  if (shipperSignature) {
    checkPageBreak(55);

    addSubSection('Shipper / Sender Signature (Signature de l\'expéditeur)');
    yPos += 1;

    if (shipperSignature.signer_name) {
      addText(`Name: ${shipperSignature.signer_name}`, 9, true);
    }
    if (shipperSignature.signer_role) {
      addText(`Role: ${shipperSignature.signer_role}`, 9);
    }
    if (shipperSignature.signer_email) {
      addText(`Email: ${shipperSignature.signer_email}`, 9);
    }
    addText(
      `Signed: ${new Date(shipperSignature.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      9
    );
    yPos += 2;

    if (shipperSignature.signatureUrl) {
      try {
        checkPageBreak(35);
        const response = await fetch(shipperSignature.signatureUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const imgWidth = 80;
        const imgHeight = 30;
        pdf.addImage(base64, 'PNG', leftMargin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 5;
      } catch (error) {
        console.error('Failed to add shipper signature:', error);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.text('[Signature image not available]', leftMargin, yPos);
        yPos += lineHeight;
      }
    }

    yPos += 5;
  }

  // Consignee Signature (corresponds to Box 24 on paper CMR)
  if (consigneeSignature) {
    checkPageBreak(55);

    addSubSection('Consignee / Receiver Signature (Signature du destinataire)');
    yPos += 1;

    if (consigneeSignature.signer_name) {
      addText(`Name: ${consigneeSignature.signer_name}`, 9, true);
    }
    if (consigneeSignature.signer_role) {
      addText(`Role: ${consigneeSignature.signer_role}`, 9);
    }
    if (consigneeSignature.signer_email) {
      addText(`Email: ${consigneeSignature.signer_email}`, 9);
    }
    addText(
      `Signed: ${new Date(consigneeSignature.created_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      9
    );
    yPos += 2;

    if (consigneeSignature.signatureUrl) {
      try {
        checkPageBreak(35);
        const response = await fetch(consigneeSignature.signatureUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        const imgWidth = 80;
        const imgHeight = 30;
        pdf.addImage(base64, 'PNG', leftMargin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 5;
      } catch (error) {
        console.error('Failed to add consignee signature:', error);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        pdf.text('[Signature image not available]', leftMargin, yPos);
        yPos += lineHeight;
      }
    }
  }

  // =============================================================================
  // FOOTER - Legal notice and page numbers
  // =============================================================================
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const footerY = pageHeight - 10;

    // Legal notice
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      'This digital CMR document is a legally valid transport contract under the CMR Convention',
      pageWidth / 2,
      footerY - 3,
      { align: 'center' }
    );

    // Generation date and page number
    pdf.setFontSize(8);
    pdf.text(
      `Generated on ${new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })} - Page ${i} of ${totalPages}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  return pdf;
}

/**
 * Generate and download a CMR PDF
 *
 * @param options - CMR document, profile, signatures, reserves, and photos
 */
export async function downloadCmrPdf(options: GeneratePdfOptions): Promise<void> {
  const pdf = await generateCmrPdf(options);
  const cmrNumber = options.cmr.cmr_number || options.cmr.id.substring(0, 8);
  const filename = `CMR_${cmrNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

/**
 * Generate CMR PDF as a Blob (useful for sharing or uploading)
 *
 * @param options - CMR document, profile, signatures, reserves, and photos
 * @returns PDF as Blob
 */
export async function generateCmrPdfBlob(options: GeneratePdfOptions): Promise<Blob> {
  const pdf = await generateCmrPdf(options);
  return pdf.output('blob');
}
