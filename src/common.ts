export class Branch {// extends vscode.TreeItem {              
    public Icon: number = 0;
    public Name: string = "";
    public Type: BranchType;
    public StartLine: number = 0;
    public EndLine: number = 0;
    public SearchPattern: string = "";

    public Parent: Branch = null;

    public Nodes: Branch[];        
}

export interface ISourceFileModel {
    getTree(): Branch[];
    getChildren(node: Branch): Branch[];
}

export enum BranchType {
    None,
    Namespace,
    Classes,
    Class,
    Interfaces,
    Interface,
    Constants,
    Const,
    Properties,
    Property,
    Methods,
    Method
}