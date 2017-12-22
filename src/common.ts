import {TextEditor} from 'vscode';
export class Branch {// extends vscode.TreeItem {                  
    public Name: string = "";
    public Type: BranchType;
    public StartLine: number = 0;
    //public EndLine: number = 0;
    public SearchPattern: string = "";

    public Parent: Branch = null;

    public Nodes: Branch[];        
}

export interface ISourceFileModel {
    setEditor(editor: TextEditor): void;
    getTree(): Branch[];
    getChildren(node: Branch): Branch[];
}

export enum BranchType {
    None,
    Namespace,
    Classes,
    AbstractClass,
    Class,
    Interfaces,
    Interface,
    Constants,
    Constant,
    Properties,
    Property,
    PrivateProperty,
    ProtectedProperty,
    PublicProperty,
    Methods,
    Method,
    PrivateMethod,
    ProtectedMethod,
    PublicMethod
}