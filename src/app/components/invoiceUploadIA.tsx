import React, { useState } from "react";

const InvoiceUploadIA: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage("");
    }
  };

  const handleAnalyze = () => {
    if (!imageFile) {
      setMessage("Por favor selecciona una imagen.");
      return;
    }

    // Aquí se integrará la lógica con Textract u otro sistema IA
    setMessage("Procesando imagen con IA...");
    setTimeout(() => {
      setMessage("Datos analizados. Precarga lista para editar.");
      // Simularía aquí la carga de un formulario con datos sugeridos
    }, 2000);
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
    </div>
  );
};

export default InvoiceUploadIA;
