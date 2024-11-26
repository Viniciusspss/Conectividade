import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import Papa from "papaparse";
import "leaflet/dist/leaflet.css";
import "./Map.css";
import L from "leaflet";

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
            id: String(feature.id).trim(),
          })),
        };
        setGeoData(cleanedGeoData);
      })
      .catch((error) => console.error("Erro ao carregar os dados geojson:", error));
  }, []);

  useEffect(() => {
    fetch("/parahybaCities.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const parsedData = Papa.parse(csvText, { header: true }).data;
        const processedData = processMunicipiosData(parsedData);
        setMunicipiosData(processedData);
      })
      .catch((error) => console.error("Erro ao carregar o CSV:", error));
  }, []);

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

  const getColor = (value) => {
    return value > 80
      ? "#225ea8"
      : value > 60
      ? "#41b6c4"
      : value > 40
      ? "#a1dab4"
      : value > 20
      ? "#ffffcc"
      : "gray";
  };

  const style = (feature) => {
    const porcentagem = feature.properties.porcentagem;
    return {
      fillColor: getColor(porcentagem),
      weight: 0.5,
      opacity: 1,
      color: "black",
      fillOpacity: 0.8,
    };
  };

  const addLegend = (map) => {
    const grades = [0, 20, 40, 60, 80];
    const labels = [];

    for (let i = 0; i < grades.length; i++) {
      labels.push(
        `<i style="background:${getColor(grades[i] + 1)}"></i> ${grades[i]}${grades[i + 1] ? `–${grades[i + 1]}` : "+"}<br>`
      );
    }

    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
      div.innerHTML = labels.join("");
      return div;
    };
    legend.addTo(map);
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
        whenCreated={(map) => {
          addLegend(map); // Adiciona a legenda quando o mapa for criado
        }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>"
        />
        <GeoJSON data={mergedGeoData} style={style} onEachFeature={onEachFeature} />
      </MapContainer>
      {renderPopup()}
    </div>
  );
};

export default MapComponent;
