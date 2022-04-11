import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
// import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { GestureController } from '@ionic/angular';
import {
  CurrentRecordingStatus,
  GenericResponse,
  RecordingData,
  VoiceRecorder
} from 'capacitor-voice-recorder';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  @ViewChild('recordButton', { read: ElementRef }) recordButton: ElementRef;

  recording = false;
  voices = [];
  durationDisplay = '';
  duration = 0;

  constructor(private gestureController: GestureController) {}

  ngOnInit() {
    // will prompt the user to give the required permission, after that
    // the function will print true / false based on the user response
    VoiceRecorder.requestAudioRecordingPermission()
      .then((result: GenericResponse) => {
        console.log('requestAudioRecordingPermission', result.value);
      });

    // will print true / false based on the status of the recording permission.
    // the promise will reject with "COULD_NOT_QUERY_PERMISSION_STATUS"
    // if the current device cannot query the current status of the recording permission
    VoiceRecorder.hasAudioRecordingPermission()
      .then((result: GenericResponse) => {
        console.log('hasAudioRecordingPermission', result.value);
      });
  }

  ngAfterViewInit() {
    const longpress = this.gestureController.create({
      el: this.recordButton.nativeElement,
      threshold: 0,
      gestureName: 'long-press',
      onStart: event => {
        console.log('onStart',event);
        // Haptics.impact({ style: ImpactStyle.Light });
        // will print true / false based on the ability
        // of the current device (or web browser) to record audio
        VoiceRecorder.canDeviceVoiceRecord()
          .then((result: GenericResponse) => {
            if (result.value) {
              this.startRecording();
            }
          }).catch(error => console.log('canDeviceVoiceRecord', error));
      },
      onEnd: event => {
        console.log('onEnd', event);
        // Haptics.impact({ style: ImpactStyle.Light });
        // Will return the current status of the plugin.
        // in this example one of these possible values will be printed: "NONE" / "RECORDING" / "PAUSED"
        VoiceRecorder.getCurrentStatus()
          .then((result: CurrentRecordingStatus) => {
            console.log(result);
            if (result.status === 'RECORDING') {
              this.stopRecording();
            }
          }).catch(error => console.log('getCurrentStatus', error));
      }
    }, true);

    longpress.enable(true);
  }

  private coutingDuration() {
    if (! this.recording) {
      this.duration = 0;
      this.durationDisplay = '';
      return;
    }

    this.duration++;
    const minutes = Math.floor(this.duration / 60).toString().padStart(2, '0');
    const seconds = (this.duration % 60).toString().padStart(2, '0');
    this.durationDisplay = `${minutes}:${seconds}`;

    setTimeout(() => this.coutingDuration(), 1000);
  }

  private startRecording() {
    if (this.recording) {
      return;
    }

    VoiceRecorder.startRecording().then(async (result: GenericResponse) => {
      if (result.value) {
        this.recording = true;
        this.coutingDuration();
      }
    }).catch(error => {
      console.log('startRecording', error);
      this.recording = false;
    });
  }

  private stopRecording() {
    if (! this.recording) {
      return;
    }

    VoiceRecorder.stopRecording().then(async (result: RecordingData) => {
      this.recording = false;
      if (result.value && result.value.recordDataBase64) {
        const recordData = result.value.recordDataBase64;
        this.voices.push(`data:audio/wav;base64,${recordData}`);
      }
    }).catch(error => {
      console.log('stopRecording', error);
      this.recording = false;
    });
  }
}
