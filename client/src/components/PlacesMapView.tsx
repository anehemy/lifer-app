import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Loader2, ChevronDown, ChevronUp, AlertCircle, MessageCircle, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface JournalEntry {
  id: number;
  question: string;
  response: string;
  createdAt: string | Date;
  placeContext?: string | null;
}

interface PlacesMapViewProps {
  entries: JournalEntry[];
}

interface LocationData {
  place: string;
  lat: number;
  lon: number;
  entries: JournalEntry[];
  isPrecise: boolean;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
}

export default function PlacesMapView({ entries }: PlacesMapViewProps) {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [newLocationValue, setNewLocationValue] = useState("");
  
  const utils = trpc.useUtils();
  const updateMetadata = trpc.journal.updateMetadata.useMutation({
    onSuccess: () => {
      toast.success("Location updated successfully!");
      setEditingLocation(null);
      setNewLocationValue("");
      // Refresh journal entries to re-geocode
      utils.journal.list.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update location: " + error.message);
    },
  });

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEntries(newExpanded);
  };

  // Geocode place names to coordinates using Nominatim (free OpenStreetMap service)
  const geocodePlace = async (place: string): Promise<{ lat: number; lon: number; isPrecise: boolean; boundingBox?: [number, number, number, number] } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`,
        {
          headers: {
            "User-Agent": "LiferApp/1.0", // Required by Nominatim
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        const boundingBox: [number, number, number, number] = [
          parseFloat(result.boundingbox[0]), // south
          parseFloat(result.boundingbox[1]), // north
          parseFloat(result.boundingbox[2]), // west
          parseFloat(result.boundingbox[3]), // east
        ];
        
        // Calculate area to determine precision
        // Large countries/states have bbox area > 1 degree squared
        const latDiff = boundingBox[1] - boundingBox[0];
        const lonDiff = boundingBox[3] - boundingBox[2];
        const area = latDiff * lonDiff;
        
        // Consider it imprecise if area > 1 sq degree (roughly > 100km x 100km)
        const isPrecise = area < 1;
        
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          isPrecise,
          boundingBox,
        };
      }
      return null;
    } catch (error) {
      console.error(`Failed to geocode ${place}:`, error);
      return null;
    }
  };

  // Process entries and geocode locations
  useEffect(() => {
    const processLocations = async () => {
      setIsGeocoding(true);

      // Group entries by place
      const placeMap = new Map<string, JournalEntry[]>();
      entries.forEach((entry) => {
        if (entry.placeContext) {
          const place = entry.placeContext.trim();
          if (!placeMap.has(place)) {
            placeMap.set(place, []);
          }
          placeMap.get(place)!.push(entry);
        }
      });

      // Geocode each unique place
      const locationPromises = Array.from(placeMap.entries()).map(async ([place, placeEntries]) => {
        const coords = await geocodePlace(place);
        if (coords) {
          return {
            place,
            lat: coords.lat,
            lon: coords.lon,
            isPrecise: coords.isPrecise,
            boundingBox: coords.boundingBox,
            entries: placeEntries,
          };
        }
        return null;
      });

      const results = await Promise.all(locationPromises);
      const validLocations = results.filter((loc) => loc !== null) as LocationData[];
      setLocations(validLocations);
      setIsGeocoding(false);
    };

    if (entries.length > 0) {
      processLocations();
    }
  }, [entries]);

  // Calculate center and zoom based on locations
  const getMapCenter = (): [number, number] => {
    if (locations.length === 0) return [20, 0]; // Default world view
    const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
    const avgLon = locations.reduce((sum, loc) => sum + loc.lon, 0) / locations.length;
    return [avgLat, avgLon];
  };

  const getMapZoom = (): number => {
    if (locations.length === 0) return 2;
    if (locations.length === 1) return 10;
    
    // Calculate bounding box
    const lats = locations.map(loc => loc.lat);
    const lons = locations.map(loc => loc.lon);
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lonRange = Math.max(...lons) - Math.min(...lons);
    const maxRange = Math.max(latRange, lonRange);
    
    // Estimate zoom level based on range
    if (maxRange > 100) return 2;
    if (maxRange > 50) return 3;
    if (maxRange > 20) return 4;
    if (maxRange > 10) return 5;
    if (maxRange > 5) return 6;
    return 8;
  };

  // Create journey path (chronological connection between locations)
  const getJourneyPath = (): [number, number][] => {
    // Sort all entries by creation date
    const sortedEntries = [...entries]
      .filter(e => e.placeContext)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const path: [number, number][] = [];
    const seenPlaces = new Set<string>();

    for (const entry of sortedEntries) {
      const place = entry.placeContext!.trim();
      if (!seenPlaces.has(place)) {
        const location = locations.find(loc => loc.place === place);
        if (location) {
          path.push([location.lat, location.lon]);
          seenPlaces.add(place);
        }
      }
    }

    return path;
  };

  const startEditingLocation = (placeName: string) => {
    setEditingLocation(placeName);
    setNewLocationValue(placeName);
  };
  
  const cancelEditingLocation = () => {
    setEditingLocation(null);
    setNewLocationValue("");
  };
  
  const saveLocationUpdate = async (oldLocation: string, newLocation: string, entryIds: number[]) => {
    if (!newLocation.trim()) {
      toast.error("Location cannot be empty");
      return;
    }
    
    if (newLocation.trim() === oldLocation) {
      cancelEditingLocation();
      return;
    }
    
    // Update all entries with this location
    for (const entryId of entryIds) {
      await updateMetadata.mutateAsync({
        id: entryId,
        placeContext: newLocation.trim(),
      });
    }
  };
  
  const handleTellMeMore = (location: LocationData) => {
    // Find the first entry to get context
    const firstEntry = location.entries[0];
    if (!firstEntry) return;
    
    // Generate a contextual question based on the entry
    const question = generateLocationQuestion(location.place, firstEntry);
    
    // Open Mr. MG chat with the contextual question
    const event = new CustomEvent('openMrMgChat', {
      detail: {
        question,
        forceNew: true
      }
    });
    window.dispatchEvent(event);
  };
  
  const generateLocationQuestion = (place: string, entry: any): string => {
    // Extract context from the entry
    const timeContext = entry.timeContext || "";
    const questionSnippet = entry.question.substring(0, 80);
    
    // Generate contextual question
    if (timeContext.includes("birth") || timeContext.includes("born") || entry.response.toLowerCase().includes("born")) {
      return `I noticed you mentioned ${place} in your entry about being born. Where specifically in ${place} were you born? Tell me about that place and what it means to you.`;
    } else if (timeContext.includes("childhood")) {
      return `You mentioned ${place} from your childhood. What specific place in ${place} do you remember most? Describe it and share a memory from there.`;
    } else {
      return `You mentioned ${place} when reflecting on "${questionSnippet}...". Where exactly in ${place} were you? Tell me more about that place and why it's significant to your story.`;
    }
  };

  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
          <div className="mb-4 flex justify-center opacity-40">
            <MapPin className="h-16 w-16" />
          </div>
          <p className="text-sm">No location-related entries yet. Write about places that shaped your journey!</p>
        </CardContent>
      </Card>
    );
  }

  if (isGeocoding) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-sm text-muted-foreground">Loading map and geocoding locations...</p>
        </CardContent>
      </Card>
    );
  }

  if (locations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
          <div className="mb-4 flex justify-center opacity-40">
            <MapPin className="h-16 w-16" />
          </div>
          <p className="text-sm">
            Could not find coordinates for the places mentioned. Try adding more specific location names like "New York City" or "Tokyo, Japan".
          </p>
        </CardContent>
      </Card>
    );
  }

  const journeyPath = getJourneyPath();

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {locations.length} {locations.length === 1 ? 'location' : 'locations'} found • {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
      </div>

      {/* Map */}
      <Card className="overflow-hidden relative z-0">
        <div className="h-[500px] w-full relative z-0">
          <MapContainer
            center={getMapCenter()}
            zoom={getMapZoom()}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Journey path */}
            {journeyPath.length > 1 && (
              <Polyline
                positions={journeyPath}
                color="#9333ea"
                weight={2}
                opacity={0.6}
                dashArray="5, 10"
              />
            )}

            {/* Location markers */}
            {locations.map((location, index) => (
              <Marker key={index} position={[location.lat, location.lon]}>
                <Popup maxWidth={300}>
                  <div className="p-2">
                    <h3 className="font-semibold text-purple-600 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {location.place}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {location.entries.length} {location.entries.length === 1 ? 'entry' : 'entries'}
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {location.entries.slice(0, 3).map((entry) => (
                        <div key={entry.id} className="text-xs border-l-2 border-purple-300 pl-2">
                          <p className="font-medium text-purple-700">{entry.question}</p>
                          <p className="text-muted-foreground mt-1 line-clamp-2">{entry.response}</p>
                        </div>
                      ))}
                      {location.entries.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{location.entries.length - 3} more...
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>

      {/* List of entries by location */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Entries by Location</h3>
        {locations.map((location) => (
          <Card key={location.place} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              {/* Location prompt - show for all locations, different message based on precision */}
              {editingLocation !== location.place && (
                <Alert className={`mb-4 ${
                  location.isPrecise 
                    ? "border-purple-200 bg-purple-50/50 dark:bg-purple-950/10"
                    : "border-purple-200 bg-purple-50 dark:bg-purple-950/20"
                }`}>
                  {location.isPrecise ? (
                    <MessageCircle className="h-4 w-4 text-purple-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-purple-600" />
                  )}
                  <AlertDescription className="text-sm text-purple-800 dark:text-purple-200">
                    {location.isPrecise ? (
                      <>
                        <p className="font-medium mb-1">📍 "{location.place}"</p>
                        <p className="mb-3">Share your experiences and memories from this place.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium mb-1">💭 "{location.place}" - Let's make this more specific</p>
                        <p className="mb-3">Update to a precise location or explore through conversation.</p>
                      </>
                    )}
                    <div className="flex gap-2">
                      {!location.isPrecise && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditingLocation(location.place)}
                          className="h-8 text-xs border-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                        >
                          <MapPin className="h-3 w-3 mr-1.5" />
                          Update Location
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleTellMeMore(location)}
                        className="h-8 text-xs bg-purple-600 hover:bg-purple-700"
                      >
                        <MessageCircle className="h-3 w-3 mr-1.5" />
                        Tell Me More
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Inline location editor */}
              {editingLocation === location.place && (
                <Alert className="mb-4 border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-sm">
                    <p className="font-medium mb-2 text-purple-800 dark:text-purple-200">Update Location</p>
                    <div className="flex gap-2 items-center">
                      <Input
                        value={newLocationValue}
                        onChange={(e) => setNewLocationValue(e.target.value)}
                        placeholder="e.g., São Paulo, Brazil"
                        className="h-8 text-sm flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveLocationUpdate(
                              location.place,
                              newLocationValue,
                              location.entries.map(e => e.id)
                            );
                          } else if (e.key === 'Escape') {
                            cancelEditingLocation();
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => saveLocationUpdate(
                          location.place,
                          newLocationValue,
                          location.entries.map(e => e.id)
                        )}
                        disabled={updateMetadata.isPending}
                        className="h-8 px-3"
                      >
                        {updateMetadata.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditingLocation}
                        disabled={updateMetadata.isPending}
                        className="h-8 px-3"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      This will update {location.entries.length} {location.entries.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-lg">{location.place}</h4>
                  <p className="text-xs text-muted-foreground">
                    {location.entries.length} {location.entries.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 ml-8">
                {location.entries.map((entry) => {
                  const isExpanded = expandedEntries.has(entry.id);
                  const isLongResponse = entry.response.length > 150;
                  const displayResponse = !isExpanded && isLongResponse
                    ? entry.response.slice(0, 150) + "..."
                    : entry.response;

                  return (
                    <div key={entry.id} className="border-l-2 border-purple-200 pl-3 py-2">
                      <p className="text-xs text-muted-foreground mb-1">
                        {new Date(entry.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="font-medium text-sm text-purple-600 mb-2">{entry.question}</p>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">{displayResponse}</p>
                      {isLongResponse && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(entry.id)}
                          className="mt-1 text-purple-600 hover:text-purple-700 h-auto p-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              <span className="text-xs">Show less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              <span className="text-xs">Read more</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

