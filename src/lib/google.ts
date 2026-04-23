import { google } from "googleapis";
import prisma from "./prisma";

export async function createGoogleCalendarEvent(userId: string, appointmentDetails: {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || !user.googleRefreshToken) {
    console.log("No Google refresh token found for user", userId);
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
  );

  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
  });

  // Listen for renewed tokens and update DB
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      const dataToUpdate: {
        googleAccessToken?: string;
        googleRefreshToken?: string;
        googleTokenExpiresAt?: bigint;
      } = { googleAccessToken: tokens.access_token };
      
      if (tokens.refresh_token) {
        dataToUpdate.googleRefreshToken = tokens.refresh_token;
      }
      if (tokens.expiry_date) {
        dataToUpdate.googleTokenExpiresAt = BigInt(tokens.expiry_date);
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate
      });
    }
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: appointmentDetails.summary,
        description: appointmentDetails.description,
        start: {
          dateTime: appointmentDetails.startTime.toISOString(),
          timeZone: "Europe/Rome",
        },
        end: {
          dateTime: appointmentDetails.endTime.toISOString(),
          timeZone: "Europe/Rome",
        },
      },
    });
    
    return event.data;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return null;
  }
}
