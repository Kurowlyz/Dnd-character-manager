
// ===================================
// EXPORT PDF
// ===================================

async function exportPDF() {

  if(typeof html2pdf === "undefined") {
    alert("Impossible de charger le moteur PDF. Vérifie ta connexion internet.");
    return;
  }

  const element = document.querySelector("main");

  const options = {
    margin: 8,
    filename: ($("name").value || "Personnage") + ".pdf",

    image: {
      type: "jpeg",
      quality: 0.98
    },

    html2canvas: {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff"
    },

    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    },

    pagebreak: {
      mode: ["css", "legacy"]
    }
  };

  document.body.classList.add("pdf-exporting");

  try {
    await html2pdf()
      .set(options)
      .from(element)
      .save();

  } catch(error) {
    console.error(error);
    alert("Erreur lors de la création du PDF.");

  } finally {
    document.body.classList.remove("pdf-exporting");
  }
}
