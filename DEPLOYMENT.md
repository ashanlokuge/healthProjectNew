# Vercel Deployment Guide

## Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project set up
2. **Environment Variables**: You need to configure the following environment variables in Vercel

## Environment Variables Setup

In your Vercel dashboard, go to your project settings and add these environment variables:

### Required Variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL (e.g., `https://your-project-id.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (optional, but recommended)

### How to get these values:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the values from there

## Deployment Steps

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically detect this as a Vite project

## Troubleshooting

### If the UI doesn't show:

1. **Check browser console** for JavaScript errors
2. **Verify environment variables** are set correctly in Vercel
3. **Check build logs** in Vercel dashboard for any build errors
4. **Ensure Supabase project** is properly configured

### Common Issues:

1. **Missing Environment Variables**: The app won't load if Supabase credentials are missing
2. **CORS Issues**: Make sure your Supabase project allows your Vercel domain
3. **Build Errors**: Check that all dependencies are properly installed

## Local Testing

To test locally before deploying:

1. Create a `.env.local` file with your environment variables
2. Run `npm run dev`
3. Verify everything works locally first

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Supabase project configured
- [ ] Database tables created
- [ ] RLS policies configured
- [ ] Storage buckets set up
- [ ] CORS settings updated for production domain

