<template>
  <div>
    <!-- PDF Generation Loading Indicator -->
    <div v-if="isGeneratingPdf" class="pdf-generation-container">
      <RobotLoadingSpinner v-if="isGeneratingPdf" color="cohortAccent" />
      <p class="loading-message overline cohortAccent--text">Converting to PDF</p>
    </div>

    <!-- Download PDF Button -->
    <v-btn outlined color="missionAccent" small @click="onDownloadDraft" class="mb-2" width="100%">
      <v-icon small class="mr-1">{{ mdiFileDownload }}</v-icon>
      Download PDF
    </v-btn>
  </div>
</template>

<script>
import { mdiFileDownload } from "@mdi/js";
import RobotLoadingSpinner from "@/components/Reused/RobotLoadingSpinner.vue";
import html2pdf from "html2pdf.js";

export default {
  name: "PdfDownloader",
  components: {
    RobotLoadingSpinner,
  },
  props: {
    aiGeneratedGalaxyMap: { type: Object, required: true },
    boundCourse: { type: Object, required: true },
    isGalaxyInfoMinimized: { type: Boolean, default: false },
    expandAllPlanets: { type: Function, required: true },
    getStarIndex: { type: Function, required: true },
    transformedStarDetails: { type: Array, required: true },
    networkRef: { type: Object, default: null },
  },
  data() {
    return {
      mdiFileDownload,
      isGeneratingPdf: false,
    };
  },
  methods: {
    async onDownloadDraft() {
      this.isGeneratingPdf = true;

      try {
        // 1) enforce desired state
        if (!this.isGalaxyInfoMinimized) {
          this.$emit("toggle-minimize");
        }

        // 2) expand all treeview nodes
        if (typeof this.expandAllPlanets === "function") {
          await this.expandAllPlanets();
        }

        // 3) enable pdf mode styles
        const root = document.documentElement;
        root.classList.add("pdf-mode");

        // 4) let DOM settle
        await this.$nextTick();

        // 5) get the container and treeview items
        if (!this.transformedStarDetails || this.transformedStarDetails.length === 0) {
          console.error("No transformed star details available. Cannot generate PDF.");
          return;
        }

        // Find treeview items in parent component
        const parentEl = this.$parent.$el;
        const treeviewItems = parentEl.querySelectorAll(".star-treeview-item");
        console.log("Treeview items found:", treeviewItems.length);

        if (treeviewItems.length === 0) {
          console.error("No treeview items found in DOM.");
          return;
        }

        // 6) ensure network graph renders planet strokes
        if (this.networkRef && this.networkRef.redraw) {
          this.networkRef.redraw();
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // 7) generate PDF
        await this.generatePdf(treeviewItems);

        root.classList.remove("pdf-mode");
      } finally {
        this.isGeneratingPdf = false;
      }
    },

    async generatePdf(treeviewItems) {
      try {
        // Create a complete HTML document with inline styles for html2pdf.js
        const htmlContent = this.createCompleteHtmlDocument();

        // Use html2pdf.js directly on the HTML string
        await this.buildPdfFromHtml(htmlContent);
      } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
      }
    },

    async buildPdfFromHtml(htmlContent) {
      console.log("Starting PDF generation with direct HTML approach...");

      const options = {
        margin: [10, 10, 20, 10], // [top, left, bottom, right] in mm - extra bottom margin for footer
        filename: `galaxy-map-draft - ${this.aiGeneratedGalaxyMap.title}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 1, // Remove scaling to prevent truncation
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
          putOnlyUsedFonts: true,
          floatPrecision: 16,
        },
        pagebreak: {
          mode: ["css", "legacy"],
          before: ".page-break-before",
          after: ".page-break-after",
          avoid: ".avoid-break",
        },
      };

      // Use html2pdf directly on the HTML string
      try {
        const pdf = html2pdf().set(options).from(htmlContent);

        // Generate PDF and add footer
        const pdfObj = await pdf.toPdf().get("pdf");
        const totalPages = pdfObj.internal.getNumberOfPages();

        // Add footer to each page
        for (let i = 1; i <= totalPages; i++) {
          pdfObj.setPage(i);
          pdfObj.setFontSize(8);
          pdfObj.setTextColor(136, 136, 136); // Gray color
          pdfObj.text("Built with GalaxyMaps.io", 190, 287, { align: "right" }); // Adjusted positioning
        }

        // Save the PDF
        await pdf.save();
        console.log("PDF generation completed");
      } catch (error) {
        console.error("PDF generation failed:", error);
        throw error;
      }
    },

    createCompleteHtmlDocument() {
      console.log("Creating complete HTML document for PDF generation...");

      if (!this.transformedStarDetails || this.transformedStarDetails.length === 0) {
        console.error("No transformed star details available.");
        return "";
      }

      let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Galaxy Map - ${this.aiGeneratedGalaxyMap.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
            width: 100%;
            padding: 0;
        }
        
        .page-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .page-break-before {
            page-break-before: always;
            break-before: page;
        }
        
        .page-break-after {
            page-break-after: always;
            break-after: page;
        }
        
        .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        
        .prefer-break-after {
            page-break-after: auto;
            break-after: auto;
        }
        
        .title-section {
            width: 100%;
            padding: 20px;
            border-bottom: 2px solid #E269CF;
            margin-bottom: 30px;
            background: #f9f9f9;
            border-radius: 8px;
        }
        
        .title-content {
            display: flex;
            gap: 20px;
            align-items: flex-start;
        }
        
        .galaxy-image {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 8px;
            flex-shrink: 0;
        }
        
        .galaxy-placeholder {
            width: 100px;
            height: 100px;
            background: #666;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            flex-shrink: 0;
        }
        
        .title-info {
            flex: 1;
        }
        
        .galaxy-status {
            color: #666;
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        
        .galaxy-title {
            color: #E269CF;
            font-weight: 800;
            font-size: 24px;
            line-height: 1.2;
            margin-bottom: 10px;
            word-wrap: break-word;
        }
        
        .galaxy-description {
            color: #555;
            font-size: 12px;
            line-height: 1.5;
        }
        
        .star-section {
            border-radius: 8px;
            overflow: hidden;
            page-break-inside: auto;
        }
        
        .star-header {
            background: #f5f5f5;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            text-align: center;
            border-radius: 8px;
        }
        
        .star-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .star-planet-list {
            font-size: 14px;
            color: #666;
            text-align: left;
            max-width: 500px;
            margin: 0 auto;
            font-weight: bold;
        }
        
        .star-content {
           
        }
        
        .planet-container {
            display: flex;
            margin: 15px 0;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            gap: 20px;
            page-break-inside: auto;
            padding: 10px;
        }
        
        .planet-left {
            flex: 1;
            min-width: 300px;
        }
        
        .planet-right {
            flex: 1;
            min-width: 300px;
        }
        
        .planet-title {
            color: #333;
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .planet-description {
            margin: 0 0 15px 0;
            color: #555;
            font-size: 12px;
            line-height: 1.5;
        }
        
        .notes-section {
            padding: 10px;


            margin-top: 10px;
        }
        
        .notes-title {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .instructions-section h4, .instructions-section h5, .instructions-section h6 {
            color: #007bff;
            margin: 15px 0 8px 0;
            font-size: 13px;
        }
        
        .instructions-section h5 {
            color: #333;
            font-size: 12px;
        }
        
        .instructions-section h6 {
            color: #333;
            font-size: 11px;
        }
        
        .instructions-section p {
            margin: 0 0 10px 0;
            color: #555;
            font-size: 11px;
            line-height: 1.4;
        }
        
        .instructions-section ul {
            margin: 8px 0 15px 0;
            padding-left: 20px;
        }
        
        .instructions-section li {
            margin-bottom: 4px;
            color: #555;
            font-size: 11px;
            line-height: 1.4;
        }
        
        .checkpoint {
            margin: 8px 0 15px 20px;
            color: #007bff;
            font-style: italic;
            font-size: 11px;
            line-height: 1.3;
        }
        
        .outro {
            margin: 15px 0 0 0;
            color: #666;
            font-style: italic;
            font-size: 11px;
            line-height: 1.3;
        }
        
        @media print {
            body { 
                font-size: 11px; 
            }
            .page-container {
                max-width: none;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="page-container">
        ${this.createTitleSectionHtml()}
        ${this.createStarsContentHtml()}
    </div>
</body>
</html>`;

      return htmlContent;
    },

    createTitleSectionHtml() {
      return `
        <div class="title-section avoid-break">
            <div class="title-content">
                <div>
                    ${
                      this.boundCourse?.image?.url
                        ? `<img src="${this.boundCourse.image.url}" alt="Galaxy Image" class="galaxy-image" />`
                        : `<div class="galaxy-placeholder">${this.boundCourse?.title ? this.boundCourse.title.substring(0, 3).toUpperCase() : "GAL"}</div>`
                    }
                </div>
                <div class="title-info">
                    <div class="galaxy-status">${this.boundCourse?.status || "UNLISTED"} GALAXY</div>
                    <h1 class="galaxy-title">${this.boundCourse?.title || "Untitled Galaxy"}</h1>
                    <div class="galaxy-description">${this.boundCourse?.description || "No description available"}</div>
                </div>
            </div>
        </div>
      `;
    },

    createStarsContentHtml() {
      let starsHtml = "";

      this.transformedStarDetails.forEach((starData, index) => {
        // Force page break for stars 2 and onwards, but let first star flow naturally after title
        if (index > 0) {
          // Add explicit page break wrapper with margin reset
          starsHtml += `
            <div style="page-break-before: always; break-before: page; margin: 0; padding: 0; height: 1px; width: 100%;"></div>
          `;
        }

        starsHtml += `
          <div class="star-section">
              <div class="star-header avoid-break">
                  <div class="star-title">⭐ ${starData.name}</div>
                  ${
                    starData.children && starData.children.length > 0
                      ? `
                      <div class="star-planet-list">
                          ${starData.children
                            .map(
                              (planet, planetIndex) =>
                                `${planetIndex === starData.children.length - 1 ? "└─" : "├─"} 🪐 ${planet.name}`,
                            )
                            .join("<br>")}
                      </div>
                  `
                      : ""
                  }
              </div>
              <div class="star-content">
                  ${this.createPlanetsContentHtml(starData)}
              </div>
          </div>
        `;
      });

      return starsHtml;
    },

    createPlanetsContentHtml(starData) {
      let planetsHtml = "";

      if (starData.children && starData.children.length > 0) {
        starData.children.forEach((planet) => {
          if (planet.type === "planet") {
            const instructions = planet.children?.find((child) => child.type === "instructions");

            planetsHtml += `
              <div class="planet-container">
                  <div class="planet-left">
                      <h3 class="planet-title avoid-break">🪐 ${planet.name}</h3>
                      <div class="planet-description">
                          ${planet.children?.[0]?.description?.intro || planet.description || "No description available"}
                      </div>
                      <div class="notes-section">
                          <div class="notes-title">Notes:</div>
                          
                      </div>
                  </div>
                  <div class="planet-right">
                      ${instructions ? this.createInstructionsHtml(instructions.description) : ""}
                  </div>
              </div>
            `;
          }
        });
      }

      return planetsHtml;
    },

    createInstructionsHtml(instructionsData) {
      if (!instructionsData) return "";

      let html = '<div class="instructions-section">';

      if (this.isStructuredMissionInstructions(instructionsData)) {
        html += this.formatStructuredInstructionsHtml(instructionsData);
      } else {
        // Format plain text instructions
        const formattedText = instructionsData
          .replace(/\n/g, "<br>")
          .replace(/<p>/g, "<p>")
          .replace(/<h2>/g, "<h4>")
          .replace(/<h3>/g, "<h5>")
          .replace(/<ul>/g, "<ul>")
          .replace(/<li>/g, "<li>");

        html += formattedText;
      }

      html += "</div>";
      return html;
    },

    formatStructuredInstructionsHtml(instructionsData) {
      try {
        let instructions = instructionsData;
        if (typeof instructionsData === "string") {
          instructions = JSON.parse(instructionsData);
        }

        let html = "";

        const stepsArray = instructions.instructions || instructions.steps || [];
        if (stepsArray.length > 0) {
          stepsArray.forEach((step) => {
            if (step.title) {
              html += `<h6>${step.title}</h6>`;
            }

            if (step.tasks && step.tasks.length > 0) {
              html += `<ul>`;
              step.tasks.forEach((task) => {
                if (task.taskContent) {
                  html += `<li>${task.taskContent}</li>`;
                }
              });
              html += `</ul>`;
            }

            if (step.checkpoint) {
              html += `<div class="checkpoint"><em>Checkpoint: ${step.checkpoint}</em></div>`;
            }
          });
        }

        if (instructions.outro) {
          html += `<div class="outro"><em>${instructions.outro}</em></div>`;
        }

        return html;
      } catch (error) {
        console.error("Error formatting structured instructions:", error);
        return "";
      }
    },

    isStructuredMissionInstructions(content) {
      if (!content) return false;

      try {
        if (typeof content === "object" && content !== null) {
          return (
            (content.instructions && Array.isArray(content.instructions)) ||
            (content.steps && Array.isArray(content.steps))
          );
        }

        if (typeof content === "string") {
          const parsed = JSON.parse(content);
          return (
            (parsed.instructions && Array.isArray(parsed.instructions)) ||
            (parsed.steps && Array.isArray(parsed.steps))
          );
        }

        return false;
      } catch (error) {
        return false;
      }
    },
  },
};
</script>

<style scoped>
/* PDF preparation styles (apply at capture time via .pdf-mode) */
:global(html.pdf-mode) {
  /* Ensure Roboto font is used */
  font-family: "Roboto", sans-serif !important;
  color: black;
}

/* Hide non-PDF UI */
:global(html.pdf-mode .history-container),
:global(html.pdf-mode .galaxy-prompt-container),
:global(html.pdf-mode .token-container),
:global(html.pdf-mode .userMenu),
:global(html.pdf-mode .version),
:global(html.pdf-mode .no-print),
:global(html.pdf-mode .ai-edit-feature-buttons),
:global(html.pdf-mode .add-star-button) {
  display: none !important;
}

/* High-contrast, remove noisy backgrounds */
:global(html.pdf-mode body),
:global(html.pdf-mode .star-treeview-item),
:global(html.pdf-mode .bg) {
  background: none !important;
  color: #111 !important;
}

/* ---- Portrait page layout for individual pages ---- */
/* Each .star-treeview-item gets its own page with network graph section */
:global(html.pdf-mode .galaxy-treeview-wrapper) {
  /* Remove any column layout since we're creating individual pages */
  column-count: 1 !important;
  column-gap: 0 !important;
}

/* Each item gets its own page, so no need for page break controls */
/* These styles are now handled by the individual page containers */
/* The PDF generation creates separate pages for each item */

/* Network graph planet strokes should render properly with the forced redraw
   in the onDownloadDraft function before PDF generation */

/* Add this class to any element you never want split */
:global(.avoid-break) {
  break-inside: avoid;
  page-break-inside: avoid;
}
</style>
