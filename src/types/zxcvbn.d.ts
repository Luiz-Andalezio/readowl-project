declare module "zxcvbn" {
  export interface ZXCVBNFeedback { warning?: string; suggestions?: string[] }
  export interface ZXCVBNResult { score: 0 | 1 | 2 | 3 | 4; feedback?: ZXCVBNFeedback }
  const zxcvbn: (password: string) => ZXCVBNResult;
  export default zxcvbn;
}
