function getAmenityTag(mood) {
  if (mood === "cafe") return 'node["amenity"="cafe"]';
  if (mood === "restaurant") return 'node["amenity"="restaurant"]';
  if (mood === "temple") return 'node["amenity"="place_of_worship"]';
  return "";
}
