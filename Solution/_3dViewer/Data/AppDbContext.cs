using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using _3dViewer.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace _3dViewer.Data
{
    public partial class AppDbContext : IdentityDbContext<AspNetUsers>
    {
        public AppDbContext()
        {
        }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public virtual DbSet<Annotations> Annotations { get; set; }
        public virtual DbSet<AspNetUsers> AspNetUsers { get; set; }
        public virtual DbSet<ModelsList> ModelsList { get; set; }
        public virtual DbSet<Permissions> Permissions { get; set; }
        public virtual DbSet<RegistrationKeys> RegistrationKeys { get; set; }
        public virtual DbSet<Scenes> Scenes { get; set; }
        public virtual DbSet<UsersTypes> UsersTypes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Annotations>(entity =>
            {
                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.Description)
                    .IsRequired()
                    .HasColumnName("description");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasColumnName("name");

                entity.Property(e => e.Positionx).HasColumnName("positionx");

                entity.Property(e => e.Positiony).HasColumnName("positiony");

                entity.Property(e => e.Positionz).HasColumnName("positionz");

                entity.Property(e => e.Roatationx).HasColumnName("roatationx");

                entity.Property(e => e.Roatationy).HasColumnName("roatationy");

                entity.Property(e => e.Roatationz).HasColumnName("roatationz");

                entity.Property(e => e.Pivotposx).HasColumnName("pivotposx");

                entity.Property(e => e.Pivotposy).HasColumnName("pivotposy");

                entity.Property(e => e.Pivotposz).HasColumnName("pivotposz");

                entity.Property(e => e.Scene).HasColumnName("scene");

                entity.HasOne(d => d.SceneNavigation)
                    .WithMany(p => p.Annotations)
                    .HasForeignKey(d => d.Scene)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Annotations_Scenes");
            });

            modelBuilder.Entity<AspNetUsers>(entity =>
            {
                entity.HasIndex(e => e.NormalizedEmail)
                    .HasName("EmailIndex");

                entity.HasIndex(e => e.NormalizedUserName)
                    .HasName("UserNameIndex")
                    .IsUnique();

                entity.Property(e => e.Birthdate)
                    .HasColumnName("birthdate")
                    .HasColumnType("date");

                entity.Property(e => e.Docissueauth)
                    .HasColumnName("docissueauth")
                    .HasMaxLength(255);

                entity.Property(e => e.Docissuedate)
                    .HasColumnName("docissuedate")
                    .HasColumnType("date");

                entity.Property(e => e.Docnumber)
                    .HasColumnName("docnumber")
                    .HasMaxLength(255);

                entity.Property(e => e.Email).HasMaxLength(256);

                entity.Property(e => e.Iin)
                    .HasColumnName("iin")
                    .HasMaxLength(255);

                entity.Property(e => e.Livingaddress)
                    .HasColumnName("livingaddress")
                    .HasMaxLength(255);

                entity.Property(e => e.Name)
                    .HasColumnName("name")
                    .HasMaxLength(255);

                entity.Property(e => e.NormalizedEmail).HasMaxLength(256);

                entity.Property(e => e.NormalizedUserName).HasMaxLength(256);

                entity.Property(e => e.Phone)
                    .HasColumnName("phone")
                    .HasMaxLength(255);

                entity.Property(e => e.Regaddress)
                    .HasColumnName("regaddress")
                    .HasMaxLength(255);

                entity.Property(e => e.UserName).HasMaxLength(256);

                entity.Property(e => e.Userkey)
                    .IsRequired()
                    .HasColumnName("userkey")
                    .HasMaxLength(20);
            });

            modelBuilder.Entity<ModelsList>(entity =>
            {
                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Description)
                    .IsRequired()
                    .HasColumnName("description");

                entity.Property(e => e.Filename)
                    .IsRequired()
                    .HasColumnName("filename")
                    .HasMaxLength(255);

                entity.Property(e => e.ImageName)
                    .HasColumnName("imagename");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasColumnName("name");
            });

            modelBuilder.Entity<Permissions>(entity =>
            {
                entity.HasKey(e => new { e.Scene, e.User });

                entity.Property(e => e.Scene).HasColumnName("scene");

                entity.Property(e => e.User).HasColumnName("user");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd();

                entity.HasOne(d => d.SceneNavigation)
                    .WithMany(p => p.Permissions)
                    .HasForeignKey(d => d.Scene)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Permissions_Scenes1");

                entity.HasOne(d => d.UserNavigation)
                    .WithMany(p => p.Permissions)
                    .HasForeignKey(d => d.User)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Permissions_user");
            });

            modelBuilder.Entity<RegistrationKeys>(entity =>
            {
                entity.HasKey(e => e.KeyValue);

                entity.Property(e => e.KeyValue).HasMaxLength(20);

                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.IssueDate).HasColumnType("datetime");

                entity.Property(e => e.Note).HasMaxLength(255);

                entity.Property(e => e.UserName).HasMaxLength(255);

                entity.Property(e => e.UserType).HasMaxLength(255);
            });

            modelBuilder.Entity<Scenes>(entity =>
            {
                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd();

                entity.Property(e => e.Description)
                    .IsRequired()
                    .HasColumnName("description");

                entity.Property(e => e.Ispublic).HasColumnName("ispublic");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasColumnName("name");

                entity.Property(e => e.Source)
                    .IsRequired()
                    .HasColumnName("source");
            });

            modelBuilder.Entity<UsersTypes>(entity =>
            {
                entity.Property(e => e.Id).HasColumnName("id");

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasColumnName("name")
                    .HasMaxLength(255);
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
