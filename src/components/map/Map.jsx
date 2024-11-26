import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";
import "./Map.css";

export const processMunicipiosData = (municipios) => {
  return municipios.map((row) => {
    const porcentagemRaw = row["% moradores cobertos"]?.replace("%", "").replace(",", ".") || "0";
    const porcentagem = parseFloat(porcentagemRaw);
    return {
      ...row,
      "% moradores cobertos": porcentagem,
      "Código IBGE": row["Código IBGE"] ? String(row["Código IBGE"].trim()) : "Desconhecido",
    };
  });
};

const MapComponent = () => {
  const [geoData, setGeoData] = useState(null);
  const [municipiosData, setMunicipiosData] = useState(null);
  const [mergedGeoData, setMergedGeoData] = useState(null);
  const [selectedMunicipio, setSelectedMunicipio] = useState(null);
  const [selectedPorcentagem, setSelectedPorcentagem] = useState(null);


  useEffect(() => {
    fetch("/geojs-pb-mun.json")
      .then((response) => response.json())
      .then((data) => {

        const cleanedGeoData = {
          ...data,
          features: data.features.map((feature) => ({
            ...feature,
            id: String(feature.id).trim(), // Limpar ID do GeoJSON
          })),
        };
        setGeoData(cleanedGeoData);
      })
      .catch((error) => {
        console.error("Erro ao carregar os dados geojson:", error);
      });
  }, []);

  // Carregar CSV
  useEffect(() => {
    fetch("/parahybaCities.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const parsedData = Papa.parse(csvText, { header: true }).data;
        const processedData = processMunicipiosData(parsedData);
        setMunicipiosData(processedData);
      })
      .catch((error) => {
        console.error("Erro ao carregar o CSV:", error);
      });
  }, []);

  // Mesclar GeoJSON com dados do CSV
  useEffect(() => {
    if (geoData && municipiosData) {

      const mergedData = {
        ...geoData,
        features: geoData.features.map((feature) => {
          const municipioId = feature.properties?.id || feature.id;
          const municipioData = municipiosData.find(
            (row) => row["Código IBGE"] === String(municipioId)
          );
  
          const porcentagem = municipioData?.["% moradores cobertos"] || "N/A";

          return {
            ...feature,
            properties: {
              ...feature.properties,
              ...municipioData,
              porcentagem,
            },
          };
        }),
      };
      setMergedGeoData(mergedData);
    }
  }, [geoData, municipiosData]);
  
  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        const nomeMunicipio =
          feature.properties?.NOME || feature.properties?.name || "Nome não disponível";
        const porcentagem =
          feature.properties?.porcentagem !== undefined
            ? `${feature.properties.porcentagem}%`
            : "Informação não disponível";

        setSelectedMunicipio(nomeMunicipio);
        setSelectedPorcentagem(porcentagem);
      },
    });
  };


  const renderPopup = () => {
    if (!selectedMunicipio) return null;
    return (
      <div className="info-popup">
        <h3>Município: {selectedMunicipio}</h3>
        <p>Porcentagem de moradores cobertos: {selectedPorcentagem}</p>
      </div>
    );
  };


  if (!mergedGeoData) {
    return <div>Carregando mapa...</div>;
  }

  return (
    <div>
      <h1>MAPA CONECTIVIDADE</h1>
      <MapContainer
        center={[-7.1, -38.2]}
        zoom={8}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <GeoJSON data={mergedGeoData} onEachFeature={onEachFeature} />
      </MapContainer>
      {renderPopup()}
    </div>
  );
};

export default MapComponent;
