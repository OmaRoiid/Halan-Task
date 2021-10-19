import { ToastrService } from 'ngx-toastr';
import { Area } from './../models/map/area.model';
import { BaseService } from './../services/base.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { Points } from '../models/map/points.model';
import { LatLngLiteral } from '@agm/core';
import { BaseAPI } from '../models/BaseApi.model';
import { DomSanitizer } from '@angular/platform-browser';
declare const google: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  downloadJsonHref;
  isUpdate = false;
  isDeleted = false;
  selectedItem;
  polygons: Area[] = [];
  pointList: Points[];
  areaForm = new FormGroup({
    lable: new FormControl('', [Validators.required]),
    color: new FormControl('#000000', [Validators.required]),
  });
  drawingManager: any;
  selectedShape: any;
  selectedArea = 0;
  @ViewChild('content') content: any;
  constructor(
    config: NgbModalConfig,
    private modalService: NgbModal,
    private baseService: BaseService,
    private toastrService: ToastrService,
    private sanitizer: DomSanitizer
  ) {
    config.backdrop = 'static';
    config.keyboard = false;
    config.size = 'sm';
  }
  ngOnInit(): void {
    this.getAreas();
  }

  onMapReady(map): void {
    this.initDrawingManager(map);
  }
  get areaFormControls() {
    return this.areaForm.controls;
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
              }
            });
            google.maps.event.addListener(paths.getAt(p), 'insert_at', () => {
              this.updatePointList(event.overlay.getPath());
            });
            google.maps.event.addListener(paths.getAt(p), 'remove_at', () => {
              this.updatePointList(event.overlay.getPath());
            });
          }
          this.selectedShape = event.overlay;
          this.selectedShape.type = event.type;
          this.updatePointList(event.overlay.getPath());
          this.openAreaModal(this.content);
        }
        if (event.type !== google.maps.drawing.OverlayType.POLYGON) {
          this.drawingManager.setDrawingMode(null);
          this.drawingManager.setOptions({
            drawingControl: false,
          });
        }
      }
    );
  }
  // Map Methods:
  // Add the lines on map to draw it before submit
  updatePointList(path): void {
    this.pointList = [];
    const len = path.getLength();
    for (let i = 0; i < len; i++) {
      this.pointList.push(path.getAt(i).toJSON());
    }
    this.selectedArea = google.maps.geometry.spherical.computeArea(path);
  }
  openAreaModal(content): void {
    this.modalService.open(content);
  }
  updateColor(event): void {
    this.areaFormControls.color.setValue(event.target.value);
  }
  onPolyClick(content, area): void {
    this.selectedItem = area;
    this.areaFormControls.lable.patchValue(this.selectedItem.label);
    this.areaFormControls.color.patchValue(this.selectedItem.color);
    this.pointList = this.selectedItem.points;
    this.modalService.open(content);
  }
  // Zones API Methods:
  getAreas(): void {
    this.baseService.GetApiMethod('zones').subscribe(
      (responseData: Area[]) => {
        this.polygons = responseData;
      },
      (err) => {
        // recall the method of getAreas() if timeout error happens
        if (err.status == 408) {
          this.getAreas();
        } else {
          this.toastrService.error(err.statusText, 'Erorr');
        }
      },
      () => {
        this.mapingAreaPointsToGoogleLatLngArray();
      }
    );
  }
  mapingAreaPointsToGoogleLatLngArray(): void {
    this.polygons.map((area) => {
      const latlngArr: LatLngLiteral[] = [];
      if (area.points !== null) {
        area.points.forEach((path: any) => {
          latlngArr.push({
            lat: +path.lat,
            lng: +path.lng,
          });
        });
        area.points = [latlngArr];
      }
    });
  }
  onAddMapInfo(): void {
    const area: Area = {
      label: this.areaFormControls.lable.value,
      color: this.areaFormControls.color.value,
      points: this.pointList,
    };
    this.baseService.PostApiMethod('zones', area).subscribe(
      (responseData) => {
        this.toastrService.success(responseData.message);
      },
      (err) => {
        this.toastrService.error(err, 'Error');
      },
      () => {
        location.reload();
      }
    );
  }
  deleteSelectedArea(): void {
    this.baseService.DeleteApiMethod('zones', this.selectedItem._id).subscribe(
      (responseData: BaseAPI) => {
        this.toastrService.success(responseData.message);
      },
      (err) => {
        this.toastrService.error(err, 'Erorr');
      },
      () => {
        this.modalService.dismissAll();
        this.getAreas();
      }
    );
  }

  onUpdateArea(): void {
    const updatedArea = {
      label: this.areaFormControls.lable.value,
      color: this.areaFormControls.color.value,
      points: this.pointList,
    };
    this.baseService
      .UpdateApiMethod('zones', this.selectedItem._id, updatedArea)
      .subscribe(
        (responseData: BaseAPI) => {
          this.toastrService.success(responseData.message);
        },
        (err) => {
          this.toastrService.error(err, 'Erorr');
        },
        () => {
          this.modalService.dismissAll();
          this.getAreas();
        }
      );
  }
  // DownLoad File Method
  generateDownloadJsonUri(): void {
    const parsedPolygons = JSON.stringify(this.polygons);
    const uri = this.sanitizer.bypassSecurityTrustUrl(
      'data:text/json;charset=UTF-8,' + encodeURIComponent(parsedPolygons)
    );
    this.downloadJsonHref = uri;
  }
}
