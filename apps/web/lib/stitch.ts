/**
 * Stitch Design API utilities for accessing design data
 */

interface StitchDesign {
  id: string;
  name: string;
  screens: Array<{
    id: string;
    name: string;
    components: any[];
  }>;
  designTokens: Record<string, any>;
}

export async function fetchStitchDesign(accessToken: string): Promise<StitchDesign> {
  const projectId = process.env.STITCH_PROJECT_ID;

  if (!projectId) {
    throw new Error("STITCH_PROJECT_ID not configured");
  }

  const response = await fetch(
    `https://stitch.googleapis.com/mcp/projects/${projectId}/files`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Stitch API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getStitchComponent(
  accessToken: string,
  componentId: string
): Promise<any> {
  const projectId = process.env.STITCH_PROJECT_ID;

  if (!projectId) {
    throw new Error("STITCH_PROJECT_ID not configured");
  }

  const response = await fetch(
    `https://stitch.googleapis.com/mcp/projects/${projectId}/components/${componentId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Stitch API error: ${response.statusText}`);
  }

  return response.json();
}

export async function exportStitchDesignTokens(
  accessToken: string
): Promise<Record<string, any>> {
  const projectId = process.env.STITCH_PROJECT_ID;

  if (!projectId) {
    throw new Error("STITCH_PROJECT_ID not configured");
  }

  const response = await fetch(
    `https://stitch.googleapis.com/mcp/projects/${projectId}/tokens`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Stitch API error: ${response.statusText}`);
  }

  return response.json();
}
