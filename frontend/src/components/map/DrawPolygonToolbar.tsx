import L from "leaflet";
import "leaflet-draw";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { GeoJsonPolygon } from "../../types/domain";

type Props = {
  onPolygonCreated: (geometry: GeoJsonPolygon) => void;
  onLayersCleared: () => void;
};

export function DrawPolygonToolbar({ onPolygonCreated, onLayersCleared }: Props) {
  const map = useMap();

  useEffect(() => {
    const drawn = new L.FeatureGroup();
    map.addLayer(drawn);

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: { featureGroup: drawn, remove: true },
    });
    map.addControl(drawControl);

    const onCreated = (e: L.LeafletEvent & { layer: L.Layer }) => {
      drawn.clearLayers();
      drawn.addLayer(e.layer);
      if (!(e.layer instanceof L.Polygon)) return;
      const gj = e.layer.toGeoJSON() as GeoJSON.Feature;
      if (gj.type !== "Feature" || gj.geometry?.type !== "Polygon") return;
      onPolygonCreated({
        type: "Polygon",
        coordinates: gj.geometry.coordinates as number[][][],
      });
    };

    const onDeleted = () => {
      onLayersCleared();
    };

    map.on("draw:created", onCreated);
    map.on("draw:deleted", onDeleted);

    return () => {
      map.off("draw:created", onCreated);
      map.off("draw:deleted", onDeleted);
      map.removeControl(drawControl);
      map.removeLayer(drawn);
    };
  }, [map, onPolygonCreated, onLayersCleared]);

  return null;
}
