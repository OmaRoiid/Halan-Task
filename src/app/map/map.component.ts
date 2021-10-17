import { ToastrService } from 'ngx-toastr';
import { Area } from './../models/map/area.model';
import { element } from 'protractor';
import { BaseService } from './../services/base.service';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { Points } from '../models/map/points.model';
import { BaseAPI } from '../models/BaseApi.model';
declare const google: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  polygons: Area[] = [];
  lat = 29.8454;
  lng = 31.337151;
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
    private toastrService: ToastrService
  ) {
    config.backdrop = 'static';
    config.keyboard = false;
    config.size = 'sm';
  }
  ngOnInit(): void {
    this.getAreas();
  }

  getAreas(): void {
    this.baseService.GetMethodWithPipe('zones').subscribe(
      (responseData: BaseAPI) => {
        this.polygons = responseData.data;
      },
      (err) => {
        this.toastrService.error(err, 'Erorr');
      }
    );
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
  openAreaModal(content): void {
    this.modalService.open(content);
  }
  updateColor(event): void {
    this.areaFormControls.color.setValue(event.target.value);
  }
  onAddMapInfo(): void {
    const area: Area = {
      label: this.areaFormControls.lable.value,
      color: this.areaFormControls.color.value,
      points: this.pointList,
    };
    this.baseService.PostMethodWithPipe('zones', area).subscribe(
      (responseData) => {
        this.toastrService.success(responseData.message);
      },
      (err) => {
        this.toastrService.error(err, 'Error');
      },
      () => {
        this.modalService.dismissAll();
      }
    );
  }
}
