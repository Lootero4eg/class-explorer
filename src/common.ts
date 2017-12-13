export class Branch {// extends vscode.TreeItem {              
    public Icon: number = 0;
    public Name: string = "";
    public Type: BranchType;
    public StartLine: number = 0;
    public EndLine: number = 0;

    public Nodes: Branch[];        
}

export interface ISourceFileModel {
    getTree(): Branch[];
    getChildren(node: Branch): Branch[];
}

export enum BranchType {
    Namespace,
    Classes,
    Class,
    Interfaces,
    Interface,
    Properties,
    Property,
    Methods,
    Method
}