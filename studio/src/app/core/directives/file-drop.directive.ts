import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appFileDrop]',
  standalone: true
})
export class FileDropDirective {
  @Output() fileDropped = new EventEmitter<FileList>();

  // Vinculamos una clase CSS al elemento cuando hay un archivo sobre él
  @HostBinding('class.file-over') fileOver = false;

  // El archivo está sobre la zona de soltar
  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = true;
  }

  // El archivo sale de la zona de soltar
  @HostListener('dragleave', ['$event']) onDragLeave(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
  }

  // El archivo se suelta en la zona
  @HostListener('drop', ['$event']) onDrop(evt: DragEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;

    const files = evt.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileDropped.emit(files);
    }
  }
}
