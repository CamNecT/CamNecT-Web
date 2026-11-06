export type Media = string | File;

export interface Portfolio {
    uid: string
    portfolioId: string;

    title: string;
    subtitle?: string | null;
    portfolioThumbnail: Media;

    updatedAt: string;
    portfolioVisibility: boolean;

    isImportant: boolean;
}

export interface PortfolioDetail extends Portfolio {
    content: string;
    startYear: number;
    startMonth: number;
    endYear: number;
    endMonth: number;
    role: string;
    skills: string;

    portfolioImage?: Media[];
    portfolioPdf?: Media[];
    portfolioLink?: string[];

    problemSolution?: string;
}
