import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MapService } from '../services/map.service';
import { Marker } from '../models/marker.interface';
// import { MarkerCard } from '../models/marker-card.interface';
import { Location } from '../models/marker.interface';
import { BridgeService } from '../services/bridge.service';
import { MarkerCard } from '../models/marker-card.interface';

@Component({
  selector: 'ng-leaflet-universal',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit {
  map: any;
  centerLatLng: number[];
  maxDistance = 0;
  markerList: Marker[];
  constructor(
    private mapService: MapService,
    private bridgeService: BridgeService
  ) { }

  ngOnInit(): void {
    this.bridgeService.getCardSelected().subscribe((selection) => {
      const marker = this.markerList.find(
        (markers) => markers.id === selection
      );
      this.centerTo(marker.location);
    });
  }

  ngAfterViewInit(): void {
    this.map = this.mapService.L.map('map').setView([0, 0], 1);
    this.mapService.L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: 'Map data © OpenStreetMap contributors',

      }
    ).addTo(this.map);
  }

  centerTo(location: Location): void {
    this.map.setView([location.latitude, location.longitude], 10);
  }

  updateMarkers(markers: Marker[]): void {
    if (markers.length) {
      this.markerList = markers;
      markers.map((item) => this.addMarker(item));
      this.calculateCenter(markers);
    }
  }

  displayCard(data: Marker, markerSelected): void {
    this.centerTo(data.location);
    const html = this.mapService.getCardHtml(data.card);
    if (!markerSelected._popup) {
      const popup = markerSelected.bindPopup(html, {
        autoClose: false,
        maxWidth: 200,
      });
      popup.openPopup();
      return;
    }
    markerSelected._popup.openPopup();
  }

  addMarker(itemMarker: Marker): void {
    const singleMarker = new this.mapService.L.Marker([
      itemMarker.location.latitude,
      itemMarker.location.longitude,
    ]);
    singleMarker.setIcon(
      this.mapService.L.divIcon({
        html: /*html*/ `<div class="item-marker"><div class="icon-image" style="background-image: url('${itemMarker.icon}')"></div>`,
        className: 'map-marker-icon',
      })
    );
    singleMarker
      .addTo(this.map)
      .on('click', () => this.displayCard(itemMarker, singleMarker));
  }

  calculateCenter(markers): void {
    const latitudes = markers
      .map((a) => a.location.latitude)
      .sort((a, b) => a - b);
    const longitudes = markers
      .map((a) => a.location.longitude)
      .sort((a, b) => a - b);

    const minLat = latitudes[0];
    const maxLat = latitudes[latitudes.length - 1];

    const minLng = longitudes[0];
    const maxLng = longitudes[latitudes.length - 1];

    const centerLat = (minLat + maxLat) / 2;
    const centetLng = (minLng + maxLng) / 2;

    this.centerLatLng = [centerLat, centetLng];

    const distanceLat = maxLat - minLat;
    const distanceLng = maxLng - minLng;

    let lat1 = 0;
    let lon1 = 0;
    let lat2 = 0;
    let lon2 = 0;

    if (distanceLat > distanceLng) {
      lat1 = minLat;
      lat2 = maxLat;
    } else {
      lon1 = minLng;
      lon2 = maxLng;
    }

    this.maxDistance = this.calcCrow(lat1, lon1, lat2, lon2);

    this.callMap();
  }

  getCalculatedZoom(): number {
    let ratio = 6371;
    let zoom = 1;

    while (ratio > this.maxDistance) {
      ratio = ratio * 0.67;
      zoom++;
    }

    return zoom;
  }

  callMap(): void {
    const zoomValue = this.getCalculatedZoom();
    this.map.setView(this.centerLatLng, zoomValue);
  }

  calcCrow(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    lat1 = this.toRad(lat1);
    lat2 = this.toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  // Converts numeric degrees to radians
  toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}
