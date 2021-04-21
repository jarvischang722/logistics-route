export const addressToLatLng = async (address) => {
  let latLng = null;
  const storageItemKey = "addressLatLngMap";
  const addressLatLngMap = localStorage.getItem(storageItemKey)
    ? JSON.parse(localStorage.getItem(storageItemKey))
    : {};
  return new Promise((resolve, reject) => {
    if (addressLatLngMap[address]) {
      return resolve(addressLatLngMap[address]);
    }
    this.geocoder.geocode({ address: address }, async (results, status) => {
      if (status == "OK") {
        latLng = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };
        addressLatLngMap[address] = latLng;

        localStorage.setItem(storageItemKey, JSON.stringify(addressLatLngMap));
        await new Promise((r) => setTimeout(r, 500));
        resolve(latLng);
      } else {
        console.log(address);
        console.log(results);
        console.log(status);
        reject(
          `Geocode was not successful for the following reason: ${status}`
        );
      }
    });
  });
};
