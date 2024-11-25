import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import { processMunicipiosData } from "./DataProcessor";

const MapComponent = () => {
  const [geoData, setGeoData] = useState(null);
  const [municipiosData, setMunicipiosData] = useState(null);
  const [selectedMunicipio, setSelectedMunicipio] = useState(null);
  const [selectedPorcentagem, setSelectedPorcentagem] = useState(null);
  const [mergedGeoData, setMergedGeoData] = useState(null);
  const [popupPosition, setPopupPosition] = useState(null);

  const closePopup = () => {
    setSelectedMunicipio(null);
    setSelectedPorcentagem(null);
  };

  useEffect(() => {
    // Carregar GeoJSON
    fetch("/geojs-pb-mun.json")
      .then((response) => response.json())
      .then((data) => {
        setGeoData(data);
      })
      .catch((error) => {
        console.error("Erro ao carregar os dados geojson:", error);
      });
  }, []);

  useEffect(() => {
    // Carregar CSV e processar dados
    fetch("/parahybaCities.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const parsedData = Papa.parse(csvText, { header: true }).data;
        const processedData = processMunicipiosData(parsedData); // Processar dados do CSV
        console.log("dados dp csv: ", processedData);
        setMunicipiosData(processedData);
      })
      .catch((error) => {
        console.error("Erro ao carregar o CSV: ", error);
      });
  }, []);

  useEffect(() => {
    if (geoData && municipiosData) {
      const newMergedGeoData = {
        ...geoData,
        features: geoData.features.map((feature) => {
          const municipioData = municipiosData.find(
            (row) => row["Código IBGE"] === String(feature.id)
          );

          if (!municipioData) {
            console.warn("Sem dados para o município:", feature.id);
          } else {
            console.log("Dados encontrados:", municipioData);
          }

          return {
            ...feature,
            properties: {
              ...feature.properties,
              ...municipioData,
            },
          };
        }),
      };
      console.log(
        "IDs do GeoJSON:",
        geoData.features.map((feature) => feature.id)
      );
      console.log(
        "Códigos IBGE do CSV:",
        municipiosData.map((m) => m["Código IBGE"])
      );
      setMergedGeoData(newMergedGeoData);
    }
  }, [geoData, municipiosData]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: (event) => {
         // Coordenadas do clique
        const nomeMunicipio =
          feature.properties?.NOME ||
          feature.properties?.name ||
          "Nome não disponível";
        const porcentagem =
          feature.properties?.["% moradores cobertos"] ||
          "Informação não disponível";

          setPopupPosition({ x: event.containerPoint.x, y: event.containerPoint.y });
        setSelectedMunicipio(nomeMunicipio);
        setSelectedPorcentagem(porcentagem);
      },
    });
  };

  const renderPopup = () => {
    if (!selectedMunicipio) return null;
    return (
      <div className="info-popup" style={{ left: `${popupPosition.x}px`, top: `${popupPosition.y}px` }}>
        <button className="close-btn" onClick={closePopup}>
          &times; 
        </button>
        <h3>Município: {selectedMunicipio}</h3>
        <p>Porcentagem de moradores cobertos: {selectedPorcentagem}%</p>
      </div>
    );
  };

  if (!geoData) {
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
        <GeoJSON
          data={mergedGeoData || geoData}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
      {renderPopup()}
    </div>
  );
};

export default MapComponent;
