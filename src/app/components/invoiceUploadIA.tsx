import React, { useState } from "react";
import { analyzeInvoiceIA } from "../services/api"; // Asegúrate que la ruta sea correcta

const InvoiceUploadIA: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage("");
      setExtractedData(null);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result?.toString().split(",")[1]; // Quitamos el encabezado data:image/png;base64,
        if (result) resolve(result);
        else reject("No se pudo convertir el archivo.");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setMessage("Por favor selecciona una imagen.");
      return;
    }

    try {
      setMessage("Procesando imagen con IA...");
      const base64 = await convertToBase64(imageFile);
      const result = await analyzeInvoiceIA({ Content: base64 });

      setExtractedData(result.data);
      setMessage("Análisis completado. Datos precargados disponibles.");
      console.log(result); // Puedes usar esto para ver la URL de imagen y campos extraídos
    } catch (error: any) {
      setMessage("Ocurrió un error: " + error.message);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Cargar factura con análisis inteligente
      </h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      {previewUrl && (
        <div className="mb-4">
          <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto" />
        </div>
      )}

      <button
        onClick={handleAnalyze}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Analizar con IA
      </button>

      {message && <p className="mt-4 text-center text-gray-700">{message}</p>}

      {extractedData && (
        <div className="mt-6 bg-gray-100 p-4 rounded text-sm">
          <h3 className="font-bold mb-2">Datos extraídos:</h3>
          <pre className="whitespace-pre-wrap">{JSON.stringify(extractedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default InvoiceUploadIA;
