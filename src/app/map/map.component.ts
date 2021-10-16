import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { Points } from '../models/map/points.model';
declare const google: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  polygons = [];
  lat = 29.8454;
  lng = 31.337151;
  pointList: Points[];
  drawingManager: any;
  selectedShape: any;
  selectedArea = 0;
  @ViewChild('content') content: any;
  constructor(config: NgbModalConfig, private modalService: NgbModal) {
    config.backdrop = 'static';
    config.keyboard = false;
    config.size = 'sm';
  }
  ngOnInit(): void {}

  onMapReady(map): void {
    this.initDrawingManager(map);
  }
  // this Method is responsing to add the  drawing tools on google map.
  initDrawingManager(map: any): void {
    const options = {
      drawingControl: true,
      drawingControlOptions: {
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        draggable: true,
        editable: true,
      },
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
    };
    this.drawingManager = new google.maps.drawing.DrawingManager(options);
    this.drawingManager.setMap(map);

    google.maps.event.addListener(
      this.drawingManager,
      'overlaycomplete',
      (event) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          const paths = event.overlay.getPaths();
          for (let p = 0; p < paths.getLength(); p++) {
            google.maps.event.addListener(paths.getAt(p), 'set_at', () => {
              if (!event.overlay.drag) {
                this.updatePointList(event.overlay.getPath());
                this.openAreaModal(this.content);
              }
            });
            google.maps.event.addListener(paths.getAt(p), 'insert_at', () => {
              this.updatePointList(event.overlay.getPath());
              this.openAreaModal(this.content);
            });
            google.maps.event.addListener(paths.getAt(p), 'remove_at', () => {
              this.updatePointList(event.overlay.getPath());
            });
          }
          this.updatePointList(event.overlay.getPath());
          this.selectedShape = event.overlay;
          this.selectedShape.type = event.type;
          this.openAreaModal(this.content);
        }
        if (event.type !== google.maps.drawing.OverlayType.MARKER) {
          // Switch back to non-drawing mode after drawing a shape.
          this.drawingManager.setDrawingMode(null);
          // To hide:
          this.drawingManager.setOptions({
            drawingControl: false,
          });
        }
      }
    );
  }

  deleteSelectedShape(): void {
    if (this.selectedShape) {
      this.selectedShape.setMap(null);
      this.selectedArea = 0;
      this.pointList.splice(0, this.pointList.length);
      // To show:
      this.drawingManager.setOptions({
        drawingControl: true,
      });
    }
  }

  updatePointList(path): void {
    this.pointList = [];
    const len = path.getLength();
    for (let i = 0; i < len; i++) {
      this.pointList.push(path.getAt(i).toJSON());
    }
    this.selectedArea = google.maps.geometry.spherical.computeArea(path);
  }
  openAreaModal(content) {
    this.modalService.open(content);
  }
}
