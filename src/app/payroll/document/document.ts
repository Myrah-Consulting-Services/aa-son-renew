import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-document',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document.html',
  styleUrls: ['./document.scss']
})
export class Document {
  documentList = [
    {
      fileName: 'Esarwa Employees.xlsx',
      folderName: 'Documents',
      employeeName: 'No Employee Associated',
      uploadedOn: '15/11/2024 11:16 AM'
    }
  ];

  selectedFile: File | null = null;
  isDragOver = false;

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      this.selectedFile = fileList[0];
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files.length) {
      this.selectedFile = event.dataTransfer.files[0];
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  saveFile(): void {
    if (this.selectedFile) {
      this.documentList.push({
        fileName: this.selectedFile.name,
        folderName: 'Documents',
        employeeName: 'No Employee Associated',
        uploadedOn: new Date().toLocaleString()
      });
      this.cancelUpload();
    }
  }

  cancelUpload(): void {
    this.selectedFile = null;
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'bi-file-earmark-pdf-fill';
      case 'xlsx':
      case 'xls':
        return 'bi-file-earmark-excel-fill';
      case 'zip': return 'bi-file-earmark-zip-fill';
      case 'doc':
      case 'docx':
        return 'bi-file-earmark-word-fill';
      default: return 'bi-file-earmark-fill';
    }
  }
}
