export enum FileResourceType {
  DOCUMENT = 'document',
  FOLDER = 'folder',
};

export interface FileResource {
  id: string;
  name: string;
  type: FileResourceType;
}

